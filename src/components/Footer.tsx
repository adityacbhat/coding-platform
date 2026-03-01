export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 p-8 text-center text-sm mt-auto border-t border-slate-800">
      <div className="container mx-auto">
        <p>&copy; {new Date().getFullYear()} CodePrep. Built for learning.</p>
      </div>
    </footer>
  );
}
