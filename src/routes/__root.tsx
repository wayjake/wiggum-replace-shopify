// 🌳 Root Layout - The foundation of our soap empire
// "Hi, Super Nintendo Chalmers!" - Ralph greeting every page render

import { HeadContent, Scripts, createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';
import { TanStackDevtools } from '@tanstack/react-devtools';

import appCss from '../styles.css?url';

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: "Karen's Beautiful Soap | Handcrafted Luxury" },
      {
        name: 'description',
        content: 'Discover artisanal handcrafted soaps made with natural ingredients. Lavender, honey oat, rose petal, and more luxurious varieties for gentle, nourishing skincare.',
      },
      // Open Graph
      { property: 'og:type', content: 'website' },
      { property: 'og:title', content: "Karen's Beautiful Soap" },
      { property: 'og:description', content: 'Handcrafted luxury soaps made with natural ingredients' },
      // Theme color for browsers
      { name: 'theme-color', content: '#2D5A4A' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', href: '/favicon.ico' },
      // Google Fonts - Playfair Display for headings, Karla for body
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Karla:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap',
      },
    ],
  }),

  shellComponent: RootDocument,
  component: RootLayout,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="bg-[#FDFCFB] text-[#1A1A1A] font-sans antialiased">
        {children}
        <TanStackDevtools
          config={{ position: 'bottom-right' }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  );
}

function RootLayout() {
  return <Outlet />;
}
