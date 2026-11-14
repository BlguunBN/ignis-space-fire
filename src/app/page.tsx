import Link from "next/link"

export default function Home() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">IGNIS</h1>
      <p className="text-slate-600">
        NASA microgravity combustion research intelligence dashboard —{" "}
        <a href="/research">Open Research Explorer</a>
      </p>
    </div>
  )
}
