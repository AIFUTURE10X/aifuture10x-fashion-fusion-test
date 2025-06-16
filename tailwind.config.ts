
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'border-spin': {
					'0%': {
						transform: 'rotate(0deg)'
					},
					'100%': {
						transform: 'rotate(360deg)'
					}
				},
				'gradient-shift': {
					'0%, 100%': {
						'background-position': '0% 50%'
					},
					'50%': {
						'background-position': '100% 50%'
					}
				},
				'color-cycle-1': {
					'0%': {
						background: 'conic-gradient(from 0deg at 50% 50%, #9333ea, #ec4899, #3b82f6, #10b981, #f59e0b, #9333ea)'
					},
					'25%': {
						background: 'conic-gradient(from 0deg at 50% 50%, #f59e0b, #9333ea, #ec4899, #3b82f6, #10b981, #f59e0b)'
					},
					'50%': {
						background: 'conic-gradient(from 0deg at 50% 50%, #10b981, #f59e0b, #9333ea, #ec4899, #3b82f6, #10b981)'
					},
					'75%': {
						background: 'conic-gradient(from 0deg at 50% 50%, #3b82f6, #10b981, #f59e0b, #9333ea, #ec4899, #3b82f6)'
					},
					'100%': {
						background: 'conic-gradient(from 0deg at 50% 50%, #9333ea, #ec4899, #3b82f6, #10b981, #f59e0b, #9333ea)'
					}
				},
				'color-cycle-2': {
					'0%': {
						background: 'conic-gradient(from 120deg at 50% 50%, #3b82f6, #06b6d4, #9333ea, #ec4899, #f59e0b, #3b82f6)'
					},
					'25%': {
						background: 'conic-gradient(from 120deg at 50% 50%, #ec4899, #3b82f6, #06b6d4, #9333ea, #f59e0b, #ec4899)'
					},
					'50%': {
						background: 'conic-gradient(from 120deg at 50% 50%, #9333ea, #ec4899, #3b82f6, #06b6d4, #f59e0b, #9333ea)'
					},
					'75%': {
						background: 'conic-gradient(from 120deg at 50% 50%, #f59e0b, #9333ea, #ec4899, #3b82f6, #06b6d4, #f59e0b)'
					},
					'100%': {
						background: 'conic-gradient(from 120deg at 50% 50%, #3b82f6, #06b6d4, #9333ea, #ec4899, #f59e0b, #3b82f6)'
					}
				},
				'color-cycle-3': {
					'0%': {
						background: 'conic-gradient(from 240deg at 50% 50%, #3b82f6, #1d4ed8, #1e40af, #1e3a8a, #3b82f6, #1d4ed8)'
					},
					'20%': {
						background: 'conic-gradient(from 240deg at 50% 50%, #10b981, #059669, #047857, #065f46, #10b981, #059669)'
					},
					'40%': {
						background: 'conic-gradient(from 240deg at 50% 50%, #ec4899, #db2777, #be185d, #9d174d, #ec4899, #db2777)'
					},
					'60%': {
						background: 'conic-gradient(from 240deg at 50% 50%, #f59e0b, #d97706, #b45309, #92400e, #f59e0b, #d97706)'
					},
					'80%': {
						background: 'conic-gradient(from 240deg at 50% 50%, #9333ea, #7c3aed, #6d28d9, #5b21b6, #9333ea, #7c3aed)'
					},
					'100%': {
						background: 'conic-gradient(from 240deg at 50% 50%, #3b82f6, #1d4ed8, #1e40af, #1e3a8a, #3b82f6, #1d4ed8)'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'border-spin': 'border-spin 3s linear infinite',
				'gradient-shift': 'gradient-shift 4s ease-in-out infinite',
				'color-cycle-1': 'color-cycle-1 6s ease-in-out infinite',
				'color-cycle-2': 'color-cycle-2 8s ease-in-out infinite',
				'color-cycle-3': 'color-cycle-3 10s ease-in-out infinite'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
