import { createContext, useContext, useState } from "react";

/**
 * Contexto de React que comparte el estado de búsqueda entre componentes.
 * Se usa para que la barra de búsqueda del AppShell (arriba) pueda filtrar
 * el contenido de GameList o Community sin necesidad de "prop drilling"
 * (pasar la prop por todos los niveles intermedios).
 * @type {React.Context<{query: string, setQuery: Function}|null>}
 */
const SearchContext = createContext(null);

/**
 * Proveedor del contexto de búsqueda. Debe envolver todos los componentes
 * que necesiten acceder o modificar el término de búsqueda activo.
 * En App.jsx se coloca en la raíz de la app para que esté disponible en todas las rutas.
 *
 * @component
 * @param {object}          props
 * @param {React.ReactNode} props.children - Componentes hijos que tendrán acceso al contexto.
 */
export function SearchProvider({ children }) {
  const [query, setQuery] = useState("");
  return (
    <SearchContext.Provider value={{ query, setQuery }}>
      {children}
    </SearchContext.Provider>
  );
}

/**
 * Hook personalizado para consumir el contexto de búsqueda.
 * Lanza un error descriptivo si se usa fuera de un `SearchProvider`,
 * lo que facilita detectar errores de uso durante el desarrollo.
 *
 * @returns {{ query: string, setQuery: Function }} Estado y setter del término de búsqueda.
 * @throws {Error} Si se usa fuera de un SearchProvider.
 */
export function useSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) {
    throw new Error("useSearch debe usarse dentro de SearchProvider");
  }
  return ctx;
}
