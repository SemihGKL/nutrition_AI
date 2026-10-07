const AUTHOR = 'by GOKOL Semi';

interface VersionInfo {
  version: string;
  buildDate: string; // ISO yyyy-mm-dd
}

export function formatAppVersion({ version, buildDate }: VersionInfo): string {
  const [y, m, d] = buildDate.split('-');
  return `Kaloriim v${version} · ${AUTHOR} · ${d}/${m}/${y}`;
}

export function AppVersion() {
  return (
    <div className="tabular" style={{
      textAlign: 'center', fontSize: 11, color: 'var(--ink-3)',
      marginTop: 16, letterSpacing: 0.3,
    }}>
      {formatAppVersion({ version: __APP_VERSION__, buildDate: __APP_BUILD_DATE__ })}
    </div>
  );
}
