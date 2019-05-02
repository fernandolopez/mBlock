/**
 * 菜单管理
 */
const{Menu,dialog,MenuItem} = require('electron');
const events = require('events');
var _emitter = new events.EventEmitter();
var _app,_mainMenu,_stage,_translator,_serial,_hid,_project,_fontSize,_undelete=false,_connectionStatus=false;
function AppMenu(app){
    var self = this;
    _app = app;
    _stage = _app.getStage();
    _translator = _app.getTranslator();
    _fontSize = _app.getFontSize();
    _serial = _app.getSerial();
    _project = _app.getProject();
    _hid = _app.getHID();
    _firmwareUploader = _app.getFirmwareUploader();
    this.reset = function (){
        if(!_translator){
            return;
        }
        const _menu = [
            {
                name:'File',
                label: _translator.map("File"),
                submenu: [
                    {
                        name:'New',
                        label: _translator.map('New'),
                        accelerator: 'CmdOrCtrl+N',
                        click: function (item, focusedWindow) {
                            _emitter.emit("newProject");
                        }
                    },
                    {
                        type: 'separator'
                    },
                    {
                        name:'Load Project',
                        label: _translator.map('Load Project'),
                        accelerator: 'CmdOrCtrl+O',
                        click: function (item, focusedWindow) {
                            dialog.showOpenDialog({title:_translator.map('Load Project'),properties: ['openFile'],filters: [{ name: 'Scratch', extensions: ['sb2'] }  ]},function(path){
                                if(path&&path.length>0){
                                    _project.openProject(path[0]);
                                }
                            })
                        }
                    },
                    {
                        name:'Save Project',
                        label: _translator.map('Save Project'),
                        accelerator: 'CmdOrCtrl+S',
                        click: function (item, focusedWindow) {
                            _emitter.emit("saveProject");
                        }
                    },
                    {
                        name:'Save Project As',
                        label: _translator.map('Save Project As'),
                        accelerator: 'CmdOrCtrl+Alt+S',
                        click: function (item, focusedWindow) {
                            _emitter.emit("saveProjectAs");
                        }
                    },
                    {
                        type: 'separator'
                    },
                    /*{
                        name:'Import Image',
                        label: _translator.map('Import Image')
                    },
                    {
                        name:'Export Image',
                        label: _translator.map('Export Image')
                    },
                    {
                        type: 'separator'
                    },
                    {
                        name:'Undo Revert',
                        label: _translator.map('Undo Revert')
                    },
                    {
                        name:'Revert',
                        label: _translator.map('Revert')
                    }*/
                ]
            },{
                name:'Edit',
                label: _translator.map('Edit'),
                submenu: [
                    /*{
                        name:'Undelete',
                        label: _translator.map('Undelete'),
                        enabled:_undelete,
                        click: function (item, focusedWindow) {
                            _stage.undelete();
                            _undelete = false;
                            self.update();
                        }
                    },*/
                    {
                        type: 'separator'
                    },
                    {
                        name:'Hide stage layout',
                        label: _translator.map('Hide stage layout'),
                        type:"checkbox",
                        checked:_stage.isStageMode("hide stage layout"),
                        click: function (item, focusedWindow) {
                            _stage.changeStageMode("hide stage layout");
                        }
                    },
                    {
                        name:'Small stage layout',
                        label: _translator.map('Small stage layout'),
                        type:"checkbox",
                        checked:_stage.isStageMode("small stage layout"),
                        click: function (item, focusedWindow) {
                            _stage.changeStageMode("small stage layout");
                        }
                    },
                    {
                        name:'Turbo mode',
                        label: _translator.map('Turbo mode'),
                        type:"checkbox",
                        checked:_stage.isStageMode("turbo mode"),
                        click: function (item, focusedWindow) {
                            _stage.changeStageMode("turbo mode");
                        }
                    },
                    {
                        name:'Arduino mode',
                        label: _translator.map('Arduino mode'),
                        type:"checkbox",
                        checked:_stage.isStageMode("arduino mode"),
                        click: function (item, focusedWindow) {
                            _stage.changeStageMode("arduino mode");
                        }
                    }
                ]
            },{
                name:'Connect',
                label: _translator.map('Connect'),
                submenu: [
                    {
                        name:'Serial Port',
                        label: _translator.map('Serial Port'),
                        submenu: [
                            {
                                type: 'separator'
                            },{
                            name:'Refresh',
                            label: _translator.map('Refresh'),
                            click:function (item, focusedWindow) {
                                _app.getSerial().update();
                            }
                        }]
                    },
                    {
                        name:'Bluetooth',
                        label: _translator.map('Bluetooth'),
                        submenu: [
                            {
                                type:"separator"
                            },
                            {
                                name:"Discover",
                                label:_translator.map("Discover"),
								enabled : true,
                                click: function (item, focusedWindow) { // focusedWindow : BrowserWindow
								    item.enabled = false; // 禁掉"发现"按钮
								    //item.label = _translator.map('Discovering');			
                                    _app.getBluetooth().discover(item);
                                }
                            },
                            {
                                type:"separator"
                            },
                            {
                                name:"Clear Bluetooth",
                                label:_translator.map("Clear Bluetooth"),
                                click:function(item,focusedWindow){
                                    _app.getBluetooth().clear();
                                }
                            }
                        ]
                    },
                    {
                        name:'2.4G Serial',
                        label: _translator.map('2.4G Serial'),
                        submenu: [
                            {
                                name:"Connect",
                                label:_translator.map("Connect"),
                                type:"checkbox",
                                checked:_hid.isConnected(),
                                click: function (item, focusedWindow) {
                                    _hid.connect();
                                    self.update();  //根据连接成功与否来更新菜单
                                }
                            }
                        ]
                    },
                    {
                        type:"separator"
                    },
                    {
                        name: 'Upgrade Firmware', // 安装固件
                        label: _translator.map('Upgrade Firmware'),
						enabled: _serial.isConnected(), // 只有串口连接上了才能更新固件
                        click: function(item, focusedWindow) { _emitter.emit("upgradeFirmware"); }
                    },
                    {
                        name: 'Reset Default Program', // 恢复出厂程序（仅mBot适用）
                        label: _translator.map('Reset Default Program'),
                        enabled: _firmwareUploader.allowResetDefaultProgram()&&_serial.isConnected(), // 只有串口连接上了才能恢复出厂程序
                        click: function (item, focusedWindow) {
                            _emitter.emit("resetDefaultProgram");
                        }
                    }
                    /*,{
                        name:'View Source',
                        label: _translator.map('View Source')
                    },
                    {
                        name:'Install Arduino Driver',
                        label: _translator.map('Install Arduino Driver')
                    }*/
                ]
            },{
                name:'Boards',
                label: _translator.map('Boards'),
                submenu: [
                    {
                        name:"Arduino",
                        label:"Arduino",
                        enabled:false
                    },
                    {
                        name:"arduino_uno",
                        label:"Arduino Uno",
                        type:"checkbox",
                        checked:_boards.selected("arduino_uno"),
                        click:function(item, focusedWindow){
                            _boards.selectBoard(item.name);
                        }
                    },
                    {
                        name:"arduino_leonardo",
                        label:"Arduino Leonardo",
                        type:"checkbox",
                        checked:_boards.selected("arduino_leonardo"),
                        click:function(item, focusedWindow){
                            _boards.selectBoard(item.name);
                        }
                    },
                    {
                        name:"arduino_nano328",
                        label:"Arduino Nano ( mega328 )",
                        type:"checkbox",
                        checked:_boards.selected("arduino_nano328"),
                        click:function(item, focusedWindow){
                            _boards.selectBoard(item.name);
                        }
                    },
                    {
                        name:"arduino_mega1280",
                        label:"Arduino Mega 1280",
                        type:"checkbox",
                        checked:_boards.selected("arduino_mega1280"),
                        click:function(item, focusedWindow){
                            _boards.selectBoard(item.name);
                        }
                    },
                    {
                        name:"arduino_mega2560",
                        label:"Arduino Mega 2560",
                        type:"checkbox",
                        checked:_boards.selected("arduino_mega2560"),
                        click:function(item, focusedWindow){
                            _boards.selectBoard(item.name);
                        }
                    },
                    {
                        type:"separator"
                    },
                    {
                        name:"Makeblock",
                        label:"Makeblock",
                        enabled:false
                    },
                    {
                        name:"me/orion_uno",
                        label:"Starter/Ultimate (Orion)",
                        type:"checkbox",
                        checked:_boards.selected("me/orion_uno"),
                        click:function(item, focusedWindow){
                            _boards.selectBoard(item.name);
                        }
                    },
                    {
                        name:"me/uno_shield_uno",
                        label:"Me Uno Shield",
                        type:"checkbox",
                        checked:_boards.selected("me/uno_shield_uno"),
                        click:function(item, focusedWindow){
                            _boards.selectBoard(item.name);
                        }
                    },
                    {
                        name:"me/mbot_uno",
                        label:"mBot (mCore)",
                        type:"checkbox",
                        checked:_boards.selected("me/mbot_uno"),
                        click:function(item, focusedWindow){
                            _boards.selectBoard(item.name);
                        }
                    },
                    {
                        name:"me/auriga_mega2560",
                        label:"mBot Ranger (Auriga)",
                        type:"checkbox",
                        checked:_boards.selected("me/auriga_mega2560"),
                        click:function(item, focusedWindow){
                            _boards.selectBoard(item.name);
                        }
                    },
                    {
                        name:"me/mega_pi_mega2560",
                        label:"Ultimate 2.0 (Mega Pi)",
                        type:"checkbox",
                        checked:_boards.selected("me/mega_pi_mega2560"),
                        click:function(item, focusedWindow){
                            _boards.selectBoard(item.name);
                        }
                    },
                    {
                        type:"separator"
                    },
                    {
                        name:"dpite",
                        label:"DPITE",
                        enabled: false,
                    },
                    {
                        name:"dpite/tbot",
                        label:"T-BOT",
                        type:"checkbox",
                        checked:_boards.selected("dpite/tbot"),
                        click:function(item, focusedWindow){
                            _boards.selectBoard(item.name);
                        }
                    }
                    /*,
                    {
                        name:"Others",
                        label: _translator.map('Others'),
                        enabled:false
                    },
                    {
                        name:"picoboard_unknown",
                        label:"PicoBoard",
                        type:"checkbox",
                        checked:_boards.selected("picoboard_unknown"),
                        click:function(item, focusedWindow){
                            _boards.selectBoard(item.name);
                        }
                    }*/
                ]
            },/*{
                name:'Extensions',
                label: _translator.map('Extensions'),
                submenu: [
                    {
                        name:'Manage Extensions',
                        label: _translator.map('Manage Extensions'),
                        click: function (item, focusedWindow) {

                        }
                    },
                    {
                        name:'Restore Extensions',
                        label: _translator.map('Restore Extensions'),
                        click: function (item, focusedWindow) {

                        }
                    },
                    {
                        name:'Clear Cache',
                        label: _translator.map('Clear Cache'),
                        click: function (item, focusedWindow) {

                        }
                    },
                    {
                        type:"separator"
                    },
                    {
                        name:'Microsoft Cognitiove Service Setting',
                        label: _translator.map('Microsoft Cognitive Service Setting'),
                        click: function (item, focusedWindow) {

                        }
                    },
                    {
                        type:"separator"
                    }
                ]
            },*/{
                name:'Language',
                label: _translator.map('Language'),
                submenu: []
            }/*,{
                name:'Help',
                label: _translator.map('Help'),
                submenu: [
                    {
                        name:'Exploring Robotic World',
                        label: _translator.map('Exploring Robotic World'),
                        click: function (item, focusedWindow) {
                            _emitter.emit("openURL", "http://www.makeblock.com/?utm_source=software&utm_medium=mblock&utm_campaign=mblocktomakeblock");
                        }
                    },
                    {
                        type:"separator"
                    },
                    {
                        name:'Getting Started Rapidly',
                        label: _translator.map('Getting Started Rapidly'),
                        click: function (item, focusedWindow) {
                           _emitter.emit("openURL", "http://learn.makeblock.com/getting-started-programming-with-mblock?utm_source=software&utm_medium=mblock&utm_campaign=mblocktorumeng");
                        }
                    },
                    {
                        name:'Finding Answers Online',
                        label: _translator.map('Finding Answers Online'),
                        click: function (item, focusedWindow) {
                            _emitter.emit("openURL", currentLocale=="zh-CN"?"http://bbs.makeblock.cc/forum-39-1.html?utm_source=software&utm_medium=mblock&utm_campaign=mblocktobbs":"http://forum.makeblock.cc/c/makeblock-products/mblock?utm_source=software&utm_medium=mblock&utm_campaign=mblocktoforum#scratch");
                        }
                    },
                    {
                        name:'Learn More Tutorials',
                        label: _translator.map('Learn More Tutorials'),
                        click: function (item, focusedWindow) {
                            _emitter.emit("openURL", "http://learn.makeblock.com/?utm_source=software&utm_medium=mblock&utm_campaign=mblocktolearn");
                        }
                    },
                    {
                        type:"separator"
                    },
                    {
                        name:'Check For Update',
                        label: _translator.map('Check For Update'),
                        click: function (item, focusedWindow) {
                        }
                    },
                    {
                        name:'Feedback',
                        label: _translator.map('Feedback'),
                        click: function (item, focusedWindow) {
                        }
                    }
                ]
            }*/
        ];
        var template = _menu.concat([]);
        if (process.platform === 'darwin') {
            template.unshift({
                label: _app.getName(),
                submenu: [
                    {
                        role: 'about',
                        label:_translator.map('About mBlock')
                    },
                    {
                        role: 'quit',
                        label:_translator.map('Quit')
                    }
                ]
            })
        }
        _mainMenu = Menu.buildFromTemplate(template);
        //字体菜单
        var item = _fontSize.getMenuItem();
        //_mainMenu.items[process.platform === 'darwin'?6:5].submenu.insert(0,item);
		_mainMenu.items[process.platform === 'darwin'?5:4].submenu.insert(0,item);

        var items = _translator.getMenuItems();
        for(var i=0;i<items.length;i++){
            var item = items[i];
            //_mainMenu.items[process.platform === 'darwin'?6:5].submenu.insert(0,item);
			_mainMenu.items[process.platform === 'darwin'?5:4].submenu.insert(0,item);
        }

        items = _serial.getMenuItems();
        for(var i=0;i<items.length;i++){
            var item = items[i];
            _mainMenu.items[process.platform === 'darwin'?3:2].submenu.items[0].submenu.insert(0,item);
        }
        items = _app.getBluetooth().getMenuItems();
        for(var i=0;i<items.length;i++){
            var item = items[i];
            _mainMenu.items[process.platform === 'darwin'?3:2].submenu.items[1].submenu.insert(0,item);
        }
        // 设置固件模式
        self.setMenuItemFirmwareMode();
    }
    this.selectBoard = function(item, focusedWindow){
        _boards.selectBoard(item.name);
        //self.update();
	}
    this.update = function(){
		self.reset();
        Menu.setApplicationMenu(_mainMenu);console.log('已更新菜单');
    }
    this.on = function(event,listener){
        _emitter.removeListener(event,listener);
        _emitter.on(event,listener);
    }
    this.setMenuItemFirmwareMode = function(){
        var firmwareMode;
        if (_serial.isConnected() && _boards.selected("me/auriga_mega2560")) {//已连接 & 选ranger
            firmwareMode = new MenuItem({
                name: 'Set FirmWare Mode',
                label: _translator.map('Set FirmWare Mode'),
                enabled: true,
                submenu: [
                    {
                        name: 'bluetooth mode',
                        label: _translator.map('bluetooth mode'),
                        click: function (item, focusedWindow) {
                            if (_serial.isConnected()) {
                                _serial.send(_boards.aurigaInstructions.bluetooth_mode);
                            }
                        }
                    },
                    {
                        name: 'ultrasonic mode',
                        label: _translator.map('ultrasonic mode'),
                        click: function (item, focusedWindow) {
                            if (_serial.isConnected()) {
                                _serial.send(_boards.aurigaInstructions.ultrasonic_mode);
                            }
                        }
                    },
                    {
                        name: 'line follower mode',
                        label: _translator.map('line follower mode'),
                        click: function (item, focusedWindow) {
                            if (_serial.isConnected()) {
                                _serial.send(_boards.aurigaInstructions.line_follower_mode);
                            }
                        }
                    },
                    {
                        name: 'balance mode',
                        label: _translator.map('balance mode'),
                        click: function (item, focusedWindow) {
                            if (_serial.isConnected()) {
                                _serial.send(_boards.aurigaInstructions.balance_mode);
                            }
                        }
                    }
                ]
            });
        } else {
            firmwareMode = new MenuItem({
                name: 'Set FirmWare Mode',
                label: _translator.map('Set FirmWare Mode'),
                enabled: false
            });
        }
        _mainMenu.items[process.platform === 'darwin' ? 3 : 2].submenu.insert(6, firmwareMode);
    }

    //允许撤销删除操作
    this.enableUnDelete = function () {
        _undelete = true;
        self.update();
    }
	// 所有连接的连接状态;，true：已连接，false：未连接
    this.updateConnectionStatus = function(obj){
        _connectionStatus = obj.connected;
    }
}
module.exports = AppMenu;
