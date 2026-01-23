import { describe, expect, it } from 'vitest';
import { parseCommand } from './chatParser';

describe('chatParser.parseCommand', () => {
  it('parses delete command with "the todo" correctly', () => {
    const cmd = parseCommand('Delete the todo Buy groceries');
    expect(cmd.action).toBe('delete');
    expect(cmd.taskTitle).toBe('Buy groceries');
  });

  it('parses delete command with "remove the task" correctly', () => {
    const cmd = parseCommand('Remove the task Buy groceries.');
    expect(cmd.action).toBe('delete');
    expect(cmd.taskTitle).toBe('Buy groceries');
  });

  it('parses complete command with "complete the todo" correctly', () => {
    const cmd = parseCommand('Complete the todo Buy groceries');
    expect(cmd.action).toBe('complete');
    expect(cmd.taskTitle).toBe('Buy groceries');
  });

  it('parses mark-as-done command correctly', () => {
    const cmd = parseCommand('Mark Buy groceries as done');
    expect(cmd.action).toBe('complete');
    // exact title after suffix stripping
    expect(cmd.taskTitle).toBe('Buy groceries');
  });
});

