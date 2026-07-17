export default function LogoLoader({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <img 
      src="/logo_icono-05.png" 
      alt="Cargando..." 
      width={size} 
      height={size} 
      className={`animate-pulse object-contain ${className}`}
      style={{ filter: 'drop-shadow(0px 0px 8px rgba(0, 180, 216, 0.5))' }}
    />
  );
}
