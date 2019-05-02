/**
 * IPC通讯、flash通讯
 */
module.paths = __module_paths;
const {ipcRenderer} = require('electron');
const Extension = require('extension');
const Translator = require("translator");
var packageJsonFile;
if(__asar_mode) {
    packageJsonFile = "../../../app.asar/package.json";
}
else {
    packageJsonFile = "../../../package.json";
}
const package = require(packageJsonFile);

var _flash,_ext,_translator;
function Application(flash){
    _flash = flash;
    _ext = new Extension(this);
    _translator = new Translator(this);
    var self = this;
    self.connected = false;
    self.saved = false;
    ipcRenderer.on('openProject', (sender,obj) => {  
        _flash.openProject(obj.url,obj.title);
    });  
    ipcRenderer.on('newProject', (sender,obj) => {  
        _flash.newProject(obj.title);
        self.setSaveStatus(false);
    });   
    ipcRenderer.on('setProjectTitle', (sender,obj) => {  
        _flash.setProjectTitle(obj.title);
    });  
    ipcRenderer.on('saveProject', (sender,obj) => {  
        _flash.saveProject();
    });    
    ipcRenderer.on('setLanguage', (sender,obj) => {
        _flash.setLanguage(obj.lang,obj.dict);
        _translator.setLanguage(obj.lang);
        self.updateTitle();
    });  
    ipcRenderer.on('changeStageMode',(sender,obj) =>{
        _flash.changeStageMode(obj.name);
    })
    ipcRenderer.on('package', (sender,obj) => {
        _ext.onReceived(obj.data);
        _flash.logToArduinoConsole(obj.data,false);
    });  
    ipcRenderer.on('connected', (sender,obj) => {  
        self.connected = obj.connected;
        ipcRenderer.send("connectionStatus", obj);
        self.updateTitle();
    });  
    ipcRenderer.on('changeToBoard', (sender,obj) => {  
        self.changeToBoard(obj.board);
    }); 
    ipcRenderer.on('logToArduinoConsole', (sender,obj) => {
        _flash.logToArduinoConsole(obj,true);
    });
    ipcRenderer.on('setFontSize', (sender,obj) => {
        _flash.setFontSize(obj.size);
    });
    // 表情面板前端操作监听
    ipcRenderer.on('responseEmotions', (sender, obj) => {
        console.log('into responseEmotions');
        console.log(obj.data);
        if ('single' === obj.code) {
            _flash.responseCommonData(obj.fileName, obj.data);
        } else if('more' === obj.code) {
            _flash.responseCommonData(obj.data);
        }
    });
    ipcRenderer.on('setSaveStatus', (sender,obj) => {
        self.setSaveStatus(obj.isSaved);
    });
    this.getExt = function(){
        return _ext;
    }
    this.openSuccess = function(){
        console.log("openSuccess")
    }
    this.readyForFlash = function(){
        console.log("readyForFlash");

        ipcRenderer.send("flashReady");

        var loader = document.getElementById('loader-wrapper');           //remove loading page
        var body = document.getElementById('body');
        loader.parentNode.removeChild(loader);
        body.className = '';
        // 解决打开空白的bug
		_flash.style.height = '99%';
        _flash.style.width = '99%';
    }
    this.saveProject = function(project){
        ipcRenderer.send("saveProject",project);
    }
    this.setSaveStatus = function(isSaved){
        self.saved = isSaved;
        self.updateTitle();
    }
    this.sendBytesToBoard = function(msg){
        ipcRenderer.send("package", {data:msg});
    }
    this.updateMenuStatus = function(arr){
        ipcRenderer.send("updateMenuStatus",arr);
    }
    this.updateTitle =function(){
        var textSave = self.saved ? _translator.map('Saved'): _translator.map("Not saved");
        var textConnect = self.connected ? _translator.map('Connected'): _translator.map("Disconnected");
        var title = package.description +" - " + textConnect+" - " +textSave;
        ipcRenderer.sendToHost("setAppTitle",title);
    }
    // 用户点击了“上传到Arduino”按钮
    this.uploadToArduino = function(code) {
        ipcRenderer.send("uploadToArduino", code);
    }
    // 用户点击了"用Arduino IDE编辑"按钮
    this.openArduinoIDE = function(code) {
        ipcRenderer.send("openArduinoIDE", code);
    }
    // flash被设置或者取消Arduino模式
    this.arduinoModeEnabled = function(status) {
        if(status) {
            console.log('Arduino Mode Enabled');
        }
        else {
            ipcRenderer.send("changeArduinoStageMode", false);
            console.log('Exit Arduino Mode');
        }
    }
    
    this.callFlash = function(method, args){
        return _flash[method].apply(flash, args);
    }
    
    this.callFromFlash = function(method,params){
        console.log(method+":"+params);
        ipcRenderer.send(method,params);
    }
    this.responseValue = function(index, value){
        if(arguments.length > 0){
            _flash.responseValue(index, value);
        }else{
            _flash.responseValue();
        }
    }
	
	/**
	 * 设置当前的主控板
	 * @param string currentBoardName 主控板名；如：me/mbot_uno、me/auriga_mega2560、me/mega_pi_mega2560、arduino_leonardo
	 */
    this.setProjectRobotName = function(currentBoardName){
        ipcRenderer.send("setCurrentBoardName", {'currentBoardName' : currentBoardName});
    }
	
    this.readyToRun = function(){
        return true;
    }
    this.boardConnected = function(){
        return self.connected;
    }
    this.sendMsg = function(msg){
        console.log("sendMsg:"+msg)
    }
    this.changeToBoard=function(name){ // 菜单控制板中的Makeblock选项
        name = name.toLowerCase();
        if(name.indexOf('arduino') > -1){
            window.loadScript('arduino', 'flash-core/ext/libraries/arduino/js/arduino.js', function () {
                _flash.setRobotName(name);
            });
        }else if (name.indexOf('orion_uno') > -1) { // Starter/Ultimate (Orion)
		    window.loadScript('orion', 'flash-core/ext/libraries/orion/js/orion.js', function () {
				_flash.setRobotName(name); // me/orion_uno
			});
		} else if (name.indexOf('uno_shield_uno') > -1) { // Me Uno Shield
			window.loadScript('uno_shield', 'flash-core/ext/libraries/uno_shield/js/shield.js', function () {
				_flash.setRobotName(name); // me/uno_shield_uno
			});
		} else if(name.indexOf('mbot_uno') > -1) { // mBot (mCore)
            window.loadScript("mBot","flash-core/ext/libraries/mbot/js/mbot.js",function(){
                _flash.setRobotName(name); // me/mbot_uno
            });
        } else if(name.indexOf('auriga_mega2560') > -1) { // mBot Ranger (Auriga)
            window.loadScript("Auriga","flash-core/ext/libraries/Auriga/js/Auriga.js",function(){
                _flash.setRobotName(name); // me/auriga_mega2560
            });
        }  else if (name.indexOf('mega_pi_mega2560') > -1) { // Ultimate 2.0 (Mega Pi)
			window.loadScript('mega_pi', 'flash-core/ext/libraries/mega_pi/js/MegaPi.js', function () {
				_flash.setRobotName(name); // me/mega_pi_mega2560
			});
        }  else if (name.indexOf('tbot') > -1) { // DPITE T-BOT
			window.loadScript('tbot', 'flash-core/ext/libraries/tbot/js/TBOT.js', function () {
				_flash.setRobotName(name); // dpite/tbot
			});
		} 
    }
    /**
     * 保存收藏表情面板文件
     * @param string fileName
     * @param string data
     */
    this.saveDrawFile = function (fileName,data) {
        console.log('into saveDrawFile');
        ipcRenderer.send('saveDrawFile', {fileName:fileName, data: data});
    }
    /**
     * 删除表情面板文件
     * @param string fileName
     */
    this.deleteDrawFile = function (fileName) {
        console.log('into deleteDrawFile');
        ipcRenderer.send('deleteDrawFile', {fileName: fileName});
    }
    /**
     * 读取表情面板文件
     * @param string fileName
     * @param string label (preset-预设，custom-添加)
     */

    this.readDrawFile = function (label, fileName) {
        console.log('into readDrawFile');
        console.log(fileName);
        ipcRenderer.send('readDrawFile', {fileName: fileName, label: label});
    }
    /**
     * 获取表情面板文件列表
     * @param string label (preset-预设，custom-添加)
     */
    this.getEmotionList = function (label) {
        console.log('into getEmotionList');
        console.log(label);
        ipcRenderer.send('getEmotionList', {label: label});
    };

}
module.exports = Application;
