import type { Operation, Labels } from './api';
/**
 * Apply the given labels to an operation. When the operation is run as a task,
 * using {@link run} or {@link spawn}, the labels get applied to the task as
 * well.
 *
 * If the task operation already has labels, the existing labels are not
 * removed. See {@link setLabels} if you want to replace the existing labels
 * entirely.
 */
export function withLabels<T>(operation: Operation<T>, labels: Labels): Operation<T> {
  if(operation) {
    operation.labels = { ...(operation.labels || {}), ...labels };
  }
  return operation;
}

/**
 * Like {@link withLabels}, but replaces the existing labels entirely.
 */
export function setLabels<T>(operation: Operation<T>, labels: Labels): Operation<T> {
  if(operation) {
    operation.labels = labels;
  }
  return operation;
}
