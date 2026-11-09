export const createSelection = () => ({ selected: new Set(), history: [] });

export function selectionReducer(state, action, lattice) {
  if (action.type === "undo") {
    if (!state.history.length) return state;
    return {
      selected: new Set(state.history[state.history.length - 1]),
      history: state.history.slice(0, -1),
    };
  }
  const selected = new Set(state.selected);
  if (action.type === "toggle") {
    if (!lattice.byId.has(action.id)) return state;
    if (selected.has(action.id)) selected.delete(action.id);
    else selected.add(action.id);
  } else if (action.type === "clear") selected.clear();
  else if (action.type === "preset") {
    selected.clear();
    for (const id of action.ids) if (lattice.byId.has(id)) selected.add(id);
  } else if (action.type === "remove-pitch") {
    for (const id of selected)
      if (lattice.byId.get(id).pitch === action.pitch) selected.delete(id);
  } else return state;
  if (
    selected.size === state.selected.size &&
    [...selected].every((id) => state.selected.has(id))
  )
    return state;
  return {
    selected,
    history: [...state.history.slice(-49), [...state.selected]],
  };
}
