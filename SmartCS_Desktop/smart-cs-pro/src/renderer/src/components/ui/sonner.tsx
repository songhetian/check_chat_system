import { Toaster as Sonner } from "sonner"
import React from "react"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-slate-900 group-[.toaster]:text-slate-50 group-[.toaster]:border-slate-800 group-[.toaster]:shadow-2xl group-[.toaster]:rounded-lg group-[.toaster]:font-sans",
          description: "group-[.toast]:text-slate-400 group-[.toast]:text-xs",
          actionButton:
            "group-[.toast]:bg-cyan-500 group-[.toast]:text-white group-[.toast]:font-bold",
          cancelButton:
            "group-[.toast]:bg-slate-800 group-[.toast]:text-slate-400",
          title: "group-[.toast]:text-sm group-[.toast]:font-black group-[.toast]:uppercase group-[.toast]:tracking-wider",
          icon: "group-[.toast]:text-cyan-500",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
