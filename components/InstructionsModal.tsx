import React from 'react';
import { X, CalendarPlus, Settings, Sparkles, Command, CheckSquare, RefreshCcw } from 'lucide-react';

interface InstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InstructionsModal: React.FC<InstructionsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const sections = [
    {
      title: "Crear y Gestionar Eventos",
      icon: <CalendarPlus className="text-blue-600 dark:text-blue-400" size={24} />,
      content: (
        <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 dark:text-gray-300">
          <li><strong>Crear:</strong> Usa el botón "+" o haz clic en cualquier hueco del calendario.</li>
          <li><strong>Arrastrar:</strong> En vistas de Semana/Día, arrastra para mover o cambiar la duración.</li>
          <li><strong>Papelera:</strong> ¿Borraste algo por error? Abre la papelera en la barra lateral para restaurar eventos eliminados recientemente.</li>
        </ul>
      )
    },
    {
      title: "Tareas y Productividad",
      icon: <CheckSquare className="text-emerald-600 dark:text-emerald-400" size={24} />,
      content: (
        <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 dark:text-gray-300">
          <li><strong>Panel Lateral:</strong> Actívalo con el icono de "check" en la cabecera para ver tu lista to-do.</li>
          <li><strong>Prioridad:</strong> Marca tareas como importantes con la estrella (⭐) para que aparezcan primero.</li>
          <li><strong>Completar:</strong> Marca las casillas desde el panel o directamente desde las vistas de calendario.</li>
        </ul>
      )
    },
    {
      title: "Mis Calendarios",
      icon: <Settings className="text-purple-600 dark:text-purple-400" size={24} />,
      content: (
        <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 dark:text-gray-300">
          <li><strong>Visibilidad:</strong> Muestra u oculta categorías usando los checkboxes del menú lateral.</li>
          <li><strong>Personalizar:</strong> Crea nuevos calendarios o edita el color y nombre de los existentes.</li>
          <li><strong>Organizar:</strong> Arrastra y suelta los calendarios en la lista para cambiar su orden de prioridad.</li>
        </ul>
      )
    },
    {
      title: "Asistente IA (Gemini)",
      icon: <Sparkles className="text-yellow-500" size={24} />,
      content: (
        <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 dark:text-gray-300">
          <li><strong>Chat:</strong> Pide crear eventos complejos ("Clase de yoga martes y jueves").</li>
          <li><strong>Multimedia:</strong> Sube fotos de invitaciones o volantes; la IA extraerá los datos automáticamente.</li>
          <li><strong>Voz:</strong> Usa el micrófono para dictar tus planes mientras caminas.</li>
        </ul>
      )
    },
    {
      title: "Sincronización y Datos",
      icon: <RefreshCcw className="text-indigo-600 dark:text-indigo-400" size={24} />,
      content: (
        <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 dark:text-gray-300">
          <li><strong>Google Calendar:</strong> Conecta tu cuenta desde la barra lateral para ver tus eventos de la nube.</li>
          <li><strong>Importar/Exportar:</strong> Ve a Ajustes para descargar una copia de seguridad (.ics) o importar eventos de otras apps.</li>
          <li><strong>Offline:</strong> La app funciona sin internet (los datos se guardan en tu dispositivo).</li>
        </ul>
      )
    },
    {
      title: "Atajos y Vistas",
      icon: <Command className="text-gray-600 dark:text-gray-400" size={24} />,
      content: (
        <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 dark:text-gray-300">
          <li>Teclas <strong>J / K</strong>: Anterior / Siguiente fecha.</li>
          <li>Tecla <strong>T</strong>: Volver a Hoy.</li>
          <li>Tecla <strong>/</strong>: Búsqueda rápida.</li>
          <li><strong>Filtros:</strong> Usa el icono de ajustes en la barra de búsqueda para filtrar por fecha o calendario específico.</li>
        </ul>
      )
    }
  ];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-opacity animate-fade-in-up">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-gray-100 dark:border-gray-700">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Manual de Usuario</h2>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <div className="grid md:grid-cols-2 gap-6">
            {sections.map((section, idx) => (
              <div key={idx} className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-5 border border-gray-100 dark:border-gray-800 hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                    {section.icon}
                  </div>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200">{section.title}</h3>
                </div>
                {section.content}
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 text-center">
            <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
              💡 Tus datos locales se guardan en este dispositivo. Para mayor seguridad, te recomendamos exportar copias de seguridad regularmente o sincronizar con Google.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full shadow-sm transition-colors"
          >
            Entendido
          </button>
        </div>

      </div>
    </div>
  );
};

export default InstructionsModal;