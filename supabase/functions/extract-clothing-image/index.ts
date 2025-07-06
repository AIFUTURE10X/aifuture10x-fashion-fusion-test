import { corsHeaders } from '../_shared/cors.ts';

interface ExtractionResult {
  success: boolean;
  images?: {
    url: string;
    alt?: string;
    width?: number;
    height?: number;
  }[];
  metadata?: {
    title?: string;
    brand?: string;
    price?: string;
    category?: string;
  };
  error?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    const { url } = await req.json();
    
    if (!url || typeof url !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'Valid URL required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('🔍 Extracting images from URL:', url);

    // Fetch the webpage
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch webpage: ${response.status}`);
    }

    const html = await response.text();
    console.log('✅ Webpage fetched successfully');

    // Extract images and metadata
    const result = await extractClothingData(html, url);
    
    console.log('🎯 Extraction result:', {
      success: result.success,
      imageCount: result.images?.length || 0,
      hasMetadata: !!result.metadata
    });

    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Error extracting clothing data:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to extract clothing data'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function extractClothingData(html: string, baseUrl: string): Promise<ExtractionResult> {
  try {
    // Simple HTML parsing - extract images and common metadata patterns
    const images: { url: string; alt?: string; width?: number; height?: number; }[] = [];
    const metadata: { title?: string; brand?: string; price?: string; category?: string; } = {};

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      metadata.title = titleMatch[1].trim();
    }

    // Extract price patterns
    const pricePatterns = [
      /[£$€¥₹]\s*(\d+(?:[.,]\d{2})?)/g,
      /"price"[^>]*>([^<]+)</g,
      /class="[^"]*price[^"]*"[^>]*>([^<]+)</g
    ];
    
    for (const pattern of pricePatterns) {
      const priceMatch = html.match(pattern);
      if (priceMatch) {
        metadata.price = priceMatch[1]?.replace(/[^\d.,]/g, '') || priceMatch[0];
        break;
      }
    }

    // Extract brand from common patterns
    const brandPatterns = [
      /"brand"[^>]*>([^<]+)</g,
      /class="[^"]*brand[^"]*"[^>]*>([^<]+)</g,
      /<h1[^>]*brand[^>]*>([^<]+)</g
    ];
    
    for (const pattern of brandPatterns) {
      const brandMatch = html.match(pattern);
      if (brandMatch) {
        metadata.brand = brandMatch[1].trim();
        break;
      }
    }

    // Extract images with priority for product images
    const imgRegex = /<img[^>]+src="([^"]+)"[^>]*(?:alt="([^"]*)")?[^>]*(?:width="(\d+)")?[^>]*(?:height="(\d+)")?[^>]*>/gi;
    let imgMatch;
    
    while ((imgMatch = imgRegex.exec(html)) !== null) {
      let imgUrl = imgMatch[1];
      const alt = imgMatch[2] || '';
      const width = imgMatch[3] ? parseInt(imgMatch[3]) : undefined;
      const height = imgMatch[4] ? parseInt(imgMatch[4]) : undefined;

      // Convert relative URLs to absolute
      if (imgUrl.startsWith('/')) {
        const baseUrlObj = new URL(baseUrl);
        imgUrl = `${baseUrlObj.protocol}//${baseUrlObj.host}${imgUrl}`;
      } else if (imgUrl.startsWith('./')) {
        imgUrl = new URL(imgUrl, baseUrl).href;
      }

      // Filter for likely product images
      const isProductImage = (
        alt.toLowerCase().includes('product') ||
        alt.toLowerCase().includes('clothing') ||
        imgUrl.toLowerCase().includes('product') ||
        imgUrl.toLowerCase().includes('cloth') ||
        (width && height && width >= 200 && height >= 200) ||
        imgUrl.includes('cdn') ||
        imgUrl.includes('static')
      );

      // Skip very small images, icons, and logos
      const isSkippable = (
        (width && width < 100) ||
        (height && height < 100) ||
        alt.toLowerCase().includes('logo') ||
        alt.toLowerCase().includes('icon') ||
        imgUrl.includes('logo') ||
        imgUrl.includes('icon')
      );

      if (!isSkippable && (isProductImage || images.length < 10)) {
        images.push({
          url: imgUrl,
          alt: alt || undefined,
          width,
          height
        });
      }
    }

    // Sort images by likely relevance (larger images first, product-related keywords)
    images.sort((a, b) => {
      const aScore = getImageRelevanceScore(a);
      const bScore = getImageRelevanceScore(b);
      return bScore - aScore;
    });

    // Limit to top 5 most relevant images
    const topImages = images.slice(0, 5);

    console.log('📊 Extracted data:', {
      imageCount: topImages.length,
      title: metadata.title?.substring(0, 50),
      brand: metadata.brand,
      price: metadata.price
    });

    return {
      success: true,
      images: topImages,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined
    };

  } catch (error) {
    console.error('❌ Error parsing HTML:', error);
    return {
      success: false,
      error: 'Failed to parse webpage content'
    };
  }
}

function getImageRelevanceScore(image: { url: string; alt?: string; width?: number; height?: number; }): number {
  let score = 0;
  
  // Size scoring
  if (image.width && image.height) {
    const size = image.width * image.height;
    score += Math.min(size / 10000, 10); // Max 10 points for size
  }
  
  // URL keyword scoring
  const url = image.url.toLowerCase();
  if (url.includes('product')) score += 5;
  if (url.includes('cloth')) score += 3;
  if (url.includes('main')) score += 4;
  if (url.includes('hero')) score += 3;
  if (url.includes('large')) score += 2;
  
  // Alt text scoring
  if (image.alt) {
    const alt = image.alt.toLowerCase();
    if (alt.includes('product')) score += 5;
    if (alt.includes('clothing')) score += 3;
    if (alt.includes('dress') || alt.includes('shirt') || alt.includes('pants')) score += 2;
  }
  
  return score;
}