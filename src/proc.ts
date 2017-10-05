/**
 * Wrappers and utilities around the NodeJS `child_process` module.
 */ /** */

import * as proc from 'child_process';

import * as vscode from 'vscode';

// import {ExecutionResult} from './api';

export interface ExecutionResult {
  retc: number;
  stdout: string;
  stderr: string;
}


/**
 * Return value for items that have progress information
 */
export interface ProgressData {
  /**
   * Minimum progress value
   */
  minimum: number;

  /**
   * Maximum progress value
   */
  maximum: number;

  /**
   * The current progress value. Should be in [minimum, maximum)
   */
  value: number;
}

/**
 * Result of parsing a line of output
 */
export interface OutputData {
  /**
   * The progress parsed from the output
   */
  progress?: ProgressData;

  /**
   * Diagnostics parsed from the output
   */
  diagnostics?: vscode.Diagnostic[];
}

/**
 * Interface for objects that can consume line-based output
 */
export interface OutputConsumer {
  /**
   * Handle a line of output
   *
   * @param line The line of output to process
   */
  output(line: string): void;

  /**
   * Handle a line of error
   *
   * @param error the line of stderr to process
   */
  error(error: string): void;
}

/**
 * Represents an executing subprocess
 */
export interface Subprocess {
  result: Promise<ExecutionResult>;
  child: proc.ChildProcess;
}

/**
 * Execute a command and return the result
 * @param command The binary to execute
 * @param args The arguments to pass to the binary
 * @param outputConsumer An output consumer for the command execution
 * @param options Additional execution options
 *
 * @note Output from the command is accumulated into a single buffer: Commands
 * which produce a lot of output should be careful about memory constraints.
 */
export function execute(command: string,
                        args: string[],
                        outputConsumer?: OutputConsumer | null,
                        options?: proc.SpawnOptions): Subprocess {
  let child: proc.ChildProcess | null = null;
  const result = new Promise<ExecutionResult>((resolve, reject) => {
    if (process.platform != 'win32') {
      // We wrap things in `stdbuf` to disable output buffering.
      const subargs = [ '-o', '0', '-e', '0' ].concat([ command ], args);
      child = proc.spawn('stdbuf', subargs, options);
    } else {
      child = proc.spawn(command, args, options);
    }
    child.on('error', (err) => { reject(err); });
    let stdout_acc = '';
    let line_acc = '';
    let stderr_acc = '';
    let stderr_line_acc = '';
    child.stdout.on('data', (data: Uint8Array) => {
      const str = data.toString();
      const lines = str.split('\n').map(l => l.endsWith('\r') ? l.substr(0, l.length - 1) : l);
      while (lines.length > 1) {
        line_acc += lines[0];
        if (outputConsumer) {
          outputConsumer.output(line_acc);
        }
        line_acc = '';
        // Erase the first line from the list
        lines.splice(0, 1);
      }
      console.assert(lines.length, 'Invalid lines', JSON.stringify(lines));
      line_acc += lines[0];
      stdout_acc += str;
    });
    child.stderr.on('data', (data: Uint8Array) => {
      const str = data.toString();
      const lines = str.split('\n').map(l => l.endsWith('\r') ? l.substr(0, l.length - 1) : l);
      while (lines.length > 1) {
        stderr_line_acc += lines[0];
        if (outputConsumer) {
          outputConsumer.error(stderr_line_acc);
        }
        stderr_line_acc = '';
        // Erase the first line from the list
        lines.splice(0, 1);
      }
      console.assert(lines.length, 'Invalid lines', JSON.stringify(lines));
      stderr_line_acc += lines[0];
      stderr_acc += str;
    });
    // Don't stop until the child stream is closed, otherwise we might not read
    // the whole output of the command.
    child.on('close', (retc) => {
      if (line_acc && outputConsumer) {
        outputConsumer.output(line_acc);
      }
      if (stderr_line_acc && outputConsumer) {
        outputConsumer.error(stderr_line_acc);
      }
      resolve({retc : retc, stdout : stdout_acc, stderr : stderr_acc});
    });
  });
  console.assert(!!child, "Didn't start child?");
  return {child: child!, result};
}
