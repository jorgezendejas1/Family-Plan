import React from 'react';
import { X, CalendarPlus, Settings, Sparkles, Command, CheckSquare, RefreshCcw, Palette, Smartphone } from 'lucide-react';

interface InstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InstructionsModal: React.FC<InstructionsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const sections = [
    {
      title: "Gestión Avanzada de Tareas",
      icon: <CheckSquare className="text-emerald-600 dark:text-emerald-400" size={24} />,
      content: (
        <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 dark:text-gray-300">
          <li><strong>Panel Lateral:</strong> Accede tocando el icono (☑️) en la cabecera.</li>
          <li><strong>Categorías:</strong> Ahora puedes asignar un calendario a cada tarea (ej. "Trabajo", "Personal") para verla con su etiqueta de color correspondiente.</li>
          <li><strong>Prioridad:</strong> Usa la estrella (⭐) para marcar tareas importantes; aparecerán primero en la lista.</li>
          <li><strong>Limpieza:</strong> Usa el menú (...) del panel para ocultar o eliminar tareas completadas en lote.</li>
        </ul>
      )
    },
    {
      title: "Agenda y Organización Visual",
      icon: <Palette className="text-pink-600 dark:text-pink-400" size={24} />,
      content: (
        <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 dark:text-gray-300">
          <li><strong>Etiquetas de Calendario:</strong> En la vista de Agenda y en el Panel de Tareas, verás una etiqueta sutil con el nombre del calendario.</li>
          <li><strong>Colores:</strong> El diseño ahora utiliza fondos tintados suaves para facilitar la lectura sin cansar la vista.</li>
          <li><strong>Indicador 'Ahora':</strong> Una línea roja en las vistas de Agenda, Día y Semana te indica el momento exacto actual.</li>
        </ul>
      )
    },
    {
      title: "Asistente IA (Gemini)",
      icon: <Sparkles className="text-yellow-500" size={24} />,
      content: (
        <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 dark:text-gray-300">
          <li><strong>Detección de Conflictos:</strong> Si intentas crear un evento que se solapa con otro, la IA te mostrará una alerta amarilla antes de confirmar.</li>
          <li><strong>Borradores Inteligentes:</strong> La IA genera una tarjeta de vista previa (estilo Wallet). Puedes revisarla y confirmar o descartar.</li>
          <li><strong>Multimedia:</strong> Sube fotos de invitaciones o volantes; la IA extraerá los datos automáticamente.</li>
        </ul>
      )
    },
    {
      title: "Mis Calendarios",
      icon: <Settings className="text-purple-600 dark:text-purple-400" size={24} />,
      content: (
        <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 dark:text-gray-300">
          <li><strong>Visibilidad:</strong> Muestra u oculta categorías usando los checkboxes del menú lateral.</li>
          <li><strong>Orden y Edición:</strong> En el menú lateral puedes ordenar, editar colores y renombrar tus calendarios locales.</li>
          <li><strong>Google Calendar:</strong> Conecta tu cuenta para visualizar (modo lectura) tus eventos de la nube junto a los locales.</li>
        </ul>
      )
    },
    {
      title: "App, Actualizaciones y PWA",
      icon: <Smartphone className="text-blue-600 dark:text-blue-400" size={24} />,
      content: (
        <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 dark:text-gray-300">
          <li><strong>Instalación:</strong> Puedes instalar esta web como una App nativa en iOS (Compartir -> Agregar a Inicio) y Android.</li>
          <li><strong>Actualizaciones:</strong> Si hay una nueva versión disponible, verás un aviso emergente abajo a la izquierda para actualizar al instante.</li>
          <li><strong>Offline:</strong> Funciona sin internet (los datos se guardan en tu dispositivo).</li>
        </ul>
      )
    },
    {
      title: "Atajos de Teclado",
      icon: <Command className="text-gray-600 dark:text-gray-400" size={24} />,
      content: (
        <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 dark:text-gray-300">
          <li>Teclas <strong>J / K</strong>: Ir al futuro / pasado.</li>
          <li>Tecla <strong>T</strong>: Volver a Hoy.</li>
          <li>Tecla <strong>C</strong>: Crear nuevo evento.</li>
          <li>Tecla <strong>/</strong>: Búsqueda rápida global.</li>
        </ul>
      )
    }
  ];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-opacity animate-fade-in-up">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-gray-100 dark:border-gray-700">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Manual de Usuario y Novedades</h2>
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
              💡 Tus datos locales se guardan en este dispositivo. Para mayor seguridad, te recomendamos exportar copias de seguridad regularmente desde Configuración.
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