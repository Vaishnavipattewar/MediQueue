/**
 * LoadingSpinner
 * @param {string}  size     - 'sm' | 'md' | 'lg' | 'xl'
 * @param {boolean} fullPage - renders a full-viewport overlay when true
 * @param {string}  text     - optional label shown below the spinner
 */
const LoadingSpinner = ({ size = 'md', fullPage = false, text = 'Loading…' }) => {
  const sizeMap = {
    sm: 'w-5 h-5 border-[3px]',
    md: 'w-8 h-8 border-4',
    lg: 'w-12 h-12 border-4',
    xl: 'w-16 h-16 border-[5px]',
  };

  const Spinner = () => (
    <div
      className={`${sizeMap[size]} rounded-full border-blue-100 border-t-blue-600 animate-spin`}
    />
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm gap-4">
        <Spinner />
        {text && <p className="text-sm text-slate-500 font-medium">{text}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <Spinner />
      {text && <p className="text-sm text-slate-400">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
