function Home() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-4">PresNova</h1>
        <p className="text-gray-400 text-lg">
          Sistema de presentaciones profesional
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-2">Operador</h2>
          <p className="text-gray-400 mb-4">
            Controla las presentaciones desde la vista del operador
          </p>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-2">Salida</h2>
          <p className="text-gray-400 mb-4">
            Vista de salida para proyectores y pantallas
          </p>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-2">Escenario</h2>
          <p className="text-gray-400 mb-4">
            Vista para monitores de escenario
          </p>
        </div>
      </div>
    </div>
  )
}

export default Home

