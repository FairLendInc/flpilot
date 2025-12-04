export const useToast = () => {
  return {
    toast: ({ title, description }: { title: string; description?: string }) => {
      console.log(`[Toast] ${title}: ${description}`)
    },
  }
}

export const toast = ({ title, description }: { title: string; description?: string }) => {
  console.log(`[Toast] ${title}: ${description}`)
}
