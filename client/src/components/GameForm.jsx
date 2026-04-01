import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function GameForm() {
  const [formData, setFormData] = useState({
    titulo: "",
    estado: "Pendiente",
    plataforma: "",
    puntuacion: 5,
    horas_jugadas: 0,
  });

  const { id } = useParams(); // Obtenemos el ID de la URL si existe
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  // Si entramos por /edit/:id, cargamos el juego para rellenar el formulario.
  // Así reutilizamos este componente tanto para crear como para editar.
  useEffect(() => {
    if (isEditing) {
      fetch(`http://localhost:3000/api/games/${id}`)
        .then((res) => res.json())
        .then((data) => {
          // Rellenamos el formulario con los datos que vienen del backend
          setFormData({
            titulo: data.titulo,
            estado: data.estado,
            plataforma: data.plataforma,
            puntuacion: data.puntuacion,
            horas_jugadas: data.horas_jugadas,
          });
        })
        .catch((err) => console.error("Error al obtener el juego:", err));
    }
  }, [id, isEditing]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Misma pantalla, dos comportamientos: POST para crear y PUT para actualizar.
    const url = isEditing
      ? `http://localhost:3000/api/games/${id}`
      : "http://localhost:3000/api/games";

    const method = isEditing ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.status === 400) {
        alert(`⚠️ ${data.error}`);
        return;
      }

      if (response.ok) {
        alert(
          isEditing
            ? "¡Juego actualizado con éxito!"
            : "¡Juego guardado con éxito!",
        );
        navigate("/");
      }
    } catch (error) {
      console.error("Error en la operación:", error);
      alert("No se pudo conectar con el servidor.");
    }
  };

  return (
    <div className="max-w-md mx-auto bg-slate-800 p-6 rounded-lg shadow-xl text-white">
      <h2 className="text-2xl font-bold mb-6 text-teal-400">
        {isEditing ? "Editar juego" : "Añadir nuevo juego"}
      </h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm mb-1">Título</label>
          <input
            type="text"
            name="titulo"
            value={formData.titulo}
            onChange={handleChange}
            required
            className="w-full p-2 rounded bg-slate-700 border border-slate-600 focus:outline-none focus:border-teal-400"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Estado</label>
          <select
            name="estado"
            value={formData.estado}
            onChange={handleChange}
            className="w-full p-2 rounded bg-slate-700 border border-slate-600 focus:outline-none focus:border-teal-400"
          >
            <option value="Pendiente">Pendiente</option>
            <option value="Jugando">Jugando</option>
            <option value="Completado">Completado</option>
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Plataforma</label>
          <input
            type="text"
            name="plataforma"
            value={formData.plataforma}
            onChange={handleChange}
            className="w-full p-2 rounded bg-slate-700 border border-slate-600 focus:outline-none focus:border-teal-400"
          />
        </div>

        <div className="flex gap-4">
          <div className="w-1/2">
            <label className="block text-sm mb-1">Puntuación (0-10)</label>
            <input
              type="number"
              name="puntuacion"
              min="0"
              max="10"
              value={formData.puntuacion}
              onChange={handleChange}
              className="w-full p-2 rounded bg-slate-700 border border-slate-600 focus:outline-none focus:border-teal-400"
            />
          </div>

          <div className="w-1/2">
            <label className="block text-sm mb-1">Horas</label>
            <input
              type="number"
              name="horas_jugadas"
              min="0"
              value={formData.horas_jugadas}
              onChange={handleChange}
              className="w-full p-2 rounded bg-slate-700 border border-slate-600 focus:outline-none focus:border-teal-400"
            />
          </div>
        </div>

        <button
          type="submit"
          className="mt-4 bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold py-2 px-4 rounded transition-colors"
        >
          {isEditing ? "Actualizar cambios" : "Guardar juego"}
        </button>

        {isEditing && (
          <button
            type="button"
            onClick={() => navigate("/")}
            className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            Cancelar
          </button>
        )}
      </form>
    </div>
  );
}
