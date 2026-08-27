export function MjengoFooter() {
  return (
    <div className="mt-8 pt-4 border-t border-slate-800 flex items-center justify-center">
      <p className="text-xs text-slate-500">
        a product of{" "}
        <a
          href="https://mjengo-tech.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-400 hover:text-violet-400 transition-colors font-medium underline-offset-2 hover:underline"
        >
          Mjengo Corporate
        </a>
      </p>
    </div>
  )
}
