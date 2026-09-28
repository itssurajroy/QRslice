// Copyright (c) 2026 QRslice. All rights reserved.
const TYPES = [
  { name: "Cafes & Chai Shops", icon: "☕" },
  { name: "Restaurants & Fine Dining", icon: "🍽️" },
  { name: "Restobars & Lounges", icon: "🍸" },
  { name: "Food Courts & Malls", icon: "🏢" },
  { name: "Bakeries & Desserts", icon: "🍰" },
  { name: "Quick Service (QSR)", icon: "🍔" },
  { name: "Cloud Kitchens", icon: "🛵" },
  { name: "Dhabas & Family Outlets", icon: "🍛" },
  { name: "Juice Bars & Smoothies", icon: "🧃" },
  { name: "Food Trucks & Pop-ups", icon: "🚚" },
  { name: "Breweries & Taprooms", icon: "🍺" },
  { name: "Canteens & Campus Food", icon: "🎓" },
];

export function BusinessTypes() {
  return (
    <section className="border-y border-slate-200/80 bg-white py-12 relative overflow-hidden backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-center text-xs font-black text-brand uppercase tracking-widest">
          Tailored for Every Food & Beverage Concept across India 🇮🇳
        </p>

        {/* Scrolling continuous marquee */}
        <div className="relative mt-8 overflow-hidden">
          <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-28 bg-gradient-to-r from-white to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-28 bg-gradient-to-l from-white to-transparent" />

          <div className="flex animate-[scroll_25s_linear_infinite] gap-4 w-max">
            {[...TYPES, ...TYPES].map((type, i) => (
              <span
                key={`${type.name}-${i}`}
                className="flex-shrink-0 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-xs font-bold text-slate-700 shadow-sm transition-all hover:border-indigo-300 hover:bg-brand-lavender/50 hover:text-brand-dark"
              >
                <span className="text-lg">{type.icon}</span>
                <span>{type.name}</span>
              </span>
            ))}
          </div>
        </div>

        <style>{`
          @keyframes scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
      </div>
    </section>
  );
}

