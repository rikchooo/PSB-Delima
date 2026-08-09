export default function Footer() {
  return (
    <footer className="bg-green-50 border border-t border-light">
      <div className="py-6">
        <div className="text-center justify-center text-sm flex items-center gap-2">
          <p>&copy; {new Date().getFullYear()} Delima Tanjung Rejo. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}