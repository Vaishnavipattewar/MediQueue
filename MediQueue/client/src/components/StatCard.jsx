/**
 * StatCard – dashboard metric card.
 * @param {string}   title      - metric label
 * @param {string}   value      - primary value to display
 * @param {React.FC} icon       - icon component (e.g. from react-icons)
 * @param {string}   iconBg     - Tailwind bg+text classes for the icon container
 * @param {string}   subtitle   - optional secondary line of text
 * @param {number}   trend      - optional % change (positive = green, negative = red)
 */
const StatCard = ({ title, value, icon: Icon, iconBg, subtitle, trend }) => (
  <div className="card-hover p-6 animate-fade-in">
    <div className="flex items-start justify-between mb-4">
      <div className={`p-3 rounded-2xl ${iconBg}`}>
        <Icon className="w-5 h-5" />
      </div>
      {trend !== undefined && (
        <span
          className={`text-xs font-semibold px-2 py-1 rounded-full ${
            trend >= 0
              ? 'bg-emerald-50 text-emerald-600'
              : 'bg-red-50 text-red-500'
          }`}
        >
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </span>
      )}
    </div>
    <p className="text-2xl md:text-3xl font-bold text-slate-800 mb-1 tabular-nums">{value}</p>
    <p className="text-sm font-medium text-slate-600">{title}</p>
    {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
  </div>
);

export default StatCard;
