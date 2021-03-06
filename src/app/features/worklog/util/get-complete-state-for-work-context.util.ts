import {WorkContext, WorkContextType} from '../../work-context/work-context.model';
import {Dictionary, EntityState} from '@ngrx/entity';
import {Task} from '../../tasks/task.model';

export const getCompleteStateForWorkContext = (workContext: WorkContext, taskState: EntityState<Task>, archive: EntityState<Task>): {
  completeStateForWorkContext: EntityState<Task>,
  unarchivedIds: string[]
} => {
  const wid = workContext.id;

  const unarchivedIds: string[] = (workContext.type === WorkContextType.TAG)
    ? _filterIdsForTag(taskState, wid)
    : _filterIdsForProject(taskState, wid);

  const archivedIdsForTag: string[] = (workContext.type === WorkContextType.TAG)
    ? _filterIdsForTag(archive, wid)
    : _filterIdsForProject(archive, wid);

  const unarchivedEntities = _limitStateToIds(taskState, unarchivedIds);
  const archivedEntities = _limitStateToIds(archive, archivedIdsForTag);

  return {
    completeStateForWorkContext: {
      ids: [...unarchivedIds, ...archivedIdsForTag],
      entities: {
        ...unarchivedEntities,
        ...archivedEntities,
      },
    },
    unarchivedIds,
  };
};

const _filterIdsForProject = (state: EntityState<Task>, workContextId: string): string[] => (state.ids as string[]).filter(
  id => !!(state.entities[id].parentId)
    ? state.entities[state.entities[id].parentId].projectId === workContextId
    : state.entities[id].projectId === workContextId
);

const _filterIdsForTag = (state: EntityState<Task>, workContextId: string): string[] => (state.ids as string[]).filter(
  id => !!(state.entities[id].parentId)
    ? state.entities[state.entities[id].parentId].tagIds.includes(workContextId)
    : state.entities[id].tagIds.includes(workContextId)
);

const _limitStateToIds = (stateIn: EntityState<Task>, ids: string[]): Dictionary<Task> => {
  const newState = {};
  ids.forEach(id => {
    newState[id] = stateIn.entities[id];
  });
  return newState;

  // NOTE: this might be prettier, but is much much much much slower
  // return ids.reduce((acc, id) => ({
  //   ...acc,
  //   [id]: stateIn.entities[id]
  // }), {});
};
