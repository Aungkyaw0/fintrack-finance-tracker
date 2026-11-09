import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     * - public folder files (icons, images, manifest, service worker)
     */
    "/((?!_next/static|_next/image|favicon.ico|icons|images|manifest.json|sw.js|workbox-.*\\.js|sitemap\\.xml|robots\\.txt).*)",
  ],
};

