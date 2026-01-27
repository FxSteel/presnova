interface LogoScreenProps {
  logoSrc?: string | null
}

function LogoScreen({ logoSrc }: LogoScreenProps) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#000000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '24px',
      }}
    >
      {logoSrc ? (
        <img
          src={logoSrc}
          alt="Logo"
          style={{
            maxWidth: '35%',
            maxHeight: '35%',
            objectFit: 'contain',
          }}
        />
      ) : (
        <p style={{ color: '#666666', fontSize: '18px', textAlign: 'center' }}>
          No hay logo configurado
        </p>
      )}
    </div>
  )
}

export default LogoScreen
