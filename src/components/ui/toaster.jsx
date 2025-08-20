import * as React from "react"
import { useToast } from "@/components/hooks/use-toast"

import { Toast } from "@/components/ui/toast"

const Toaster = () => {
  const { toasts } = useToast()

  return (
    <div
      className="fixed top-0 right-0 z-[100] flex flex-col space-y-2 p-4 sm:p-6"
    >
      {toasts.map(function ({ id, ...props }) {
        return (
          <Toast
            key={id}
            id={id}
            {...props}
          />
        )
      })}
    </div>
  )
}

export { Toaster }