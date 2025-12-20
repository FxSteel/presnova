function Stage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-4">Vista Escenario</h1>
        <p className="text-gray-400">
          Contenido para monitores de escenario
        </p>
      </div>
      
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 min-h-[600px] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg">Sin contenido activo</p>
        </div>
      </div>
    </div>
  )
}

export default Stage

