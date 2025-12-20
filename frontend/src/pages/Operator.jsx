function Operator() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-4">Vista Operador</h1>
        <p className="text-gray-400">
          Panel de control para gestionar presentaciones
        </p>
      </div>
      
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-semibold mb-4">Controles</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Presentación actual</span>
            <span className="text-gray-500">Ninguna</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Operator

