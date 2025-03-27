"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { cn } from "@/lib/utils"
import { BookOpen, GraduationCap, MessageSquare, Users } from "lucide-react"
import { useEffect } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { cache } from "@/hooks/use-cached-fetch"

export function MainNav() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const supabase = getSupabaseBrowserClient()

  // Prefetch common data
  useEffect(() => {
    const prefetchData = async () => {
      try {
        if (!cache.has('universities')) {
          const { data } = await supabase.from('universities').select('*')
          if (data) {
            cache.set('universities', data)
          }
        }
      } catch (error) {
        console.error('Error prefetching universities:', error)
      }
    }

    prefetchData()
  }, [supabase])

  const routes = [
    {
      href: "/",
      label: "Home",
      active: pathname === "/",
    },
    {
      href: "/materials",
      label: "Materials",
      active: pathname === "/materials",
    },
    {
      href: "/courses",
      label: "Courses",
      active: pathname === "/courses",
    },
    {
      href: "/universities",
      label: "Universities",
      active: pathname === "/universities",
    },
  ]

  return (
    <div className="border-b">
      <div className="flex h-16 items-center px-4 container">
        <Link href="/" className="flex items-center">
          <GraduationCap className="h-6 w-6 text-primary mr-2" />
          <span className="font-bold text-xl">StudyHub</span>
        </Link>
        <NavigationMenu className="mx-6 hidden md:block">
          <NavigationMenuList>
            {routes.map((route) => (
              <NavigationMenuItem key={route.href}>
                <Link href={route.href} legacyBehavior passHref>
                  <NavigationMenuLink
                    className={cn(
                      navigationMenuTriggerStyle(),
                      route.active ? "text-primary font-medium" : "text-muted-foreground",
                    )}
                  >
                    {route.label}
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            ))}
            <NavigationMenuItem>
              <NavigationMenuTrigger>Resources</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                  <li className="row-span-3">
                    <NavigationMenuLink asChild>
                      <a
                        className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                        href="/materials"
                      >
                        <BookOpen className="h-6 w-6 text-primary" />
                        <div className="mb-2 mt-4 text-lg font-medium">Study Materials</div>
                        <p className="text-sm leading-tight text-muted-foreground">
                          Access high-quality study materials shared by students at your university.
                        </p>
                      </a>
                    </NavigationMenuLink>
                  </li>
                  {user && (
                    <li>
                      <NavigationMenuLink asChild>
                        <a
                          href="/forums"
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          <div className="flex items-center">
                            <MessageSquare className="h-4 w-4 mr-2 text-primary" />
                            <div className="text-sm font-medium leading-none">Forums</div>
                          </div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Discuss courses and topics with other students.
                          </p>
                        </a>
                      </NavigationMenuLink>
                    </li>
                  )}
                  <li>
                    <NavigationMenuLink asChild>
                      <a
                        href="/groups"
                        className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                      >
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2 text-primary" />
                          <div className="text-sm font-medium leading-none">Study Groups</div>
                        </div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          Join or create study groups with fellow students.
                        </p>
                      </a>
                    </NavigationMenuLink>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
        <div className="ml-auto flex items-center space-x-4">
          {user ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={() => signOut()}>
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

