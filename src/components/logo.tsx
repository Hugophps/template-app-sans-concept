import { appConfig } from '@/config/app';

export const Logo = () => (
  <div className="logo">
    <img src={appConfig.logoUrl} alt={`${appConfig.publicAppName} logo`} className="logo__image" />
    <span className="logo__text">{appConfig.publicAppName}</span>
  </div>
);
