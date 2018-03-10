import * as chai from 'chai';
import {expect} from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);

import {clearExistingKitConfigurationFile} from '../../../test-helpers';
import {DefaultEnvironment} from '../../../helpers/test/default-environment';

import {CMakeTools} from '../../../../src/cmake-tools';
import config from '../../../../src/config';

suite('Build', async() => {
  let cmt: CMakeTools;
  let testEnv: DefaultEnvironment;

  setup(async function(this: Mocha.IBeforeAndAfterContext) {
    if (process.env.HasVs != 'true') {
      this.skip();
    }
    this.timeout(100000);

    testEnv = new DefaultEnvironment('test/extension-tests/successful-build/project-folder');
    cmt = await CMakeTools.create(testEnv.vsContext);

    // This test will use all on the same kit.
    // No rescan of the tools is needed
    // No new kit selection is needed
    await clearExistingKitConfigurationFile();
    await cmt.scanForKits();
    await cmt.selectKit();

    testEnv.projectFolder.buildDirectory.clear();
  });

  teardown(async function(this: Mocha.IBeforeAndAfterContext) {
    this.timeout(30000);
    await cmt.asyncDispose();
    testEnv.teardown();
  });

  test('Configure ', async() => {
    expect(await cmt.configure()).to.be.eq(0);

    expect(testEnv.projectFolder.buildDirectory.isCMakeCachePresent).to.eql(true, 'no expected cache present');
  }).timeout(60000);

  test('Build', async() => {
    expect(await cmt.build()).to.be.eq(0);

    const result = await testEnv.result.getResultAsJson();
    expect(result['compiler']).to.eq('Microsoft Visual Studio');
  }).timeout(60000);


  test('Configure and Build', async() => {
    expect(await cmt.configure()).to.be.eq(0);
    expect(await cmt.build()).to.be.eq(0);

    const result = await testEnv.result.getResultAsJson();
    expect(result['compiler']).to.eq('Microsoft Visual Studio');
  }).timeout(60000);

  test('Configure and Build', async() => {
    expect(await cmt.configure()).to.be.eq(0);
    expect(await cmt.build()).to.be.eq(0);

    const result = await testEnv.result.getResultAsJson();
    expect(result['compiler']).to.eq('Microsoft Visual Studio');
  }).timeout(60000);

  test('Test setting watcher', async() => {

    expect(config.buildDirectory).to.be.eq('${workspaceRoot}/build');
    await testEnv.setting.changeSetting('buildDirectory', 'Hallo');
    expect(config.buildDirectory).to.be.eq('Hallo');
    testEnv.setting.restore();
    expect(config.buildDirectory).to.be.eq('${workspaceRoot}/build');
  });
});
