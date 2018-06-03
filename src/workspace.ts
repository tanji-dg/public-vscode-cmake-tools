/**
 * Module for dealing with multiple workspace directories
 */ /** */

import {ConfigurationReader} from '@cmt/config';
import paths from '@cmt/paths';
import {StateManager} from '@cmt/state';

/**
 * State attached to a directory in a workspace. Contains a config object and
 * a state management object.
 */
export class DirectoryContext {
  constructor(
      /**
       * The configuration for the associated directory.
       */
      public readonly config: ConfigurationReader,
      /**
       * The state management object associated with the directory.
       */
      public readonly state: StateManager,
  ) {}

  /**
   * Create a context object for the given path to a directory.
   * @param dir The directory for which to create a context
   * @param state The state that will be associated with the returned context
   */
  static createForDirectory(dir: string, state: StateManager): DirectoryContext {
    const config = ConfigurationReader.createForDirectory(dir);
    return new DirectoryContext(config, state);
  }

  /**
   * The path to a CMake executable associated with this directory. This should
   * be used over `ConfigurationReader.cmakePath` because it will do additional
   * path expansion and searching.
   */
  get cmakePath(): Promise<string | null> { return paths.getCMakePath(this); }
  /**
   * The CTest executable for the directory. See `cmakePath` for more
   * information.
   */
  get ctestPath(): Promise<string|null> { return paths.getCTestPath(this); }
}