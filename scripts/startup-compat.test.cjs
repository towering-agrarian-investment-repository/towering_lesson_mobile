/* global __dirname */
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const {test}=require('node:test');

const root=path.resolve(__dirname,'..');
const cssRoot=path.dirname(require.resolve('react-native-css/package.json'));
function loadPolyfill(file) {
  let getterCalls=0;
  const registered=[];
  const registry={get(name,config){registered.push([name,config()]);return function NativeView(){};}};
  const native={};
  Object.defineProperties(native,{
    NativeComponentRegistry:{enumerable:true,get(){getterCalls++;return registry;}},
    FutureNativeAPI:{enumerable:true,get(){return 'forwarded';}},
    View:{enumerable:true,get(){throw Error('Native component getter evaluated eagerly');}},
  });
  const cssView=function CssView(){};
  const module={exports:{}};
  vm.runInNewContext(fs.readFileSync(path.join(cssRoot,file),'utf8'),{
    module,
    require(name){
      if(name==='react-native')return native;
      if(name==='./View')return {View:cssView};
      throw Error('Unexpected import: '+name);
    },
  },{filename:file});
  return {exports:module.exports,registry,registered,cssView,get getterCalls(){return getterCalls;}};
}

for(const file of ['src/components/index.cts','dist/commonjs/components/index.cjs','dist/module/components/index.cjs']) {
  test(file+' preserves new native APIs and lazy CSS primitives',()=>{
    const polyfill=loadPolyfill(file);
    assert.equal(polyfill.getterCalls,0);
    assert.equal(polyfill.exports.NativeComponentRegistry,polyfill.registry);
    assert.equal(polyfill.getterCalls,1);
    assert.equal(polyfill.exports.FutureNativeAPI,'forwarded');
    assert.equal(polyfill.exports.View,polyfill.cssView);
    // Namespace imports must see forwarded APIs as own enumerable properties.
    assert(Object.keys(polyfill.exports).includes('NativeComponentRegistry'));
  });
}

test('Expo Router ActivityContents initializes with the styled React Native entry',()=>{
  const polyfill=loadPolyfill('dist/commonjs/components/index.cjs');
  const routerRoot=path.dirname(require.resolve('expo-router/package.json'));
  const module={exports:{}};
  vm.runInNewContext(fs.readFileSync(path.join(routerRoot,'build/views/ActivityContents.js'),'utf8'),{
    exports:module.exports,module,
    require(name){
      if(name==='react-native')return polyfill.exports;
      if(name==='react'||name==='react/jsx-runtime')return {};
      throw Error('Unexpected Router import: '+name);
    },
  });
  assert.equal(polyfill.registered.length,1);
  assert.equal(polyfill.registered[0][0],'ExpoRouterActivityContents');
  assert.equal(polyfill.registered[0][1].uiViewClassName,'RCTView');
  assert.equal(typeof module.exports.ActivityContents,'function');
});

function loadMetro({legacyStore=false,parent=true}={}) {
  const calls=[];
  const delegate=(...args)=>{calls.push(args);return {type:'sourceFile',filePath:'resolved.js'};};
  const module={exports:{}};
  const mockRequire=name=>{
    if(name==='nativewind/metro')return {withNativewind:config=>config};
    if(name==='@sentry/react-native/metro')return {getSentryExpoConfig:()=>({resolver:parent?{resolveRequest:delegate}:{}})};
    if(name==='node:fs')return {existsSync:()=>legacyStore};
    if(name==='node:path')return path;
    throw Error('Unexpected Metro import: '+name);
  };
  mockRequire.resolve=()=>path.join(root,'node_modules/expo-router/package.json');
  vm.runInNewContext(fs.readFileSync(path.join(root,'metro.config.js'),'utf8'),{module,require:mockRequire,__dirname:root});
  return {resolve:module.exports.resolver.resolveRequest,calls,delegate};
}
const legacy='expo-router/build/global-state/router-store';
const sentryContext={originModulePath:'D:\\project\\node_modules\\.pnpm\\sentry\\node_modules\\@sentry\\react-native\\dist\\js\\tracing\\expoRouterStore.js'};

test('only Sentry missing legacy-store probes use its optional null fallback',()=>{
  const metro=loadMetro();
  assert.equal(metro.resolve(sentryContext,legacy,'android').type,'empty');
  assert.equal(metro.calls.length,0);
  assert.equal(metro.resolve(sentryContext,'expo-router','ios').filePath,'resolved.js');
  assert.equal(metro.resolve({originModulePath:'/project/src/app/_layout.tsx'},legacy,'ios').filePath,'resolved.js');
  assert.equal(metro.calls.length,2);
});

test('an available legacy store continues through the existing resolver',()=>{
  const metro=loadMetro({legacyStore:true});
  assert.equal(metro.resolve(sentryContext,legacy,'android').filePath,'resolved.js');
  assert.equal(metro.calls.length,1);
});

test('normal resolution uses Metro context when no parent resolver is set',()=>{
  const metro=loadMetro({parent:false});
  assert.equal(metro.resolve({...sentryContext,resolveRequest:metro.delegate},'react-native','android').filePath,'resolved.js');
  assert.equal(metro.calls.length,1);
});
