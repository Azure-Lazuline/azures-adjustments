window.azuretweaks={};

//most of the code here isn't very good, but AFAIK it all works. Copy at your own risk, though

//define submenu
sc.OPTION_TYPES.OPEN_MENU_AZURE = Math.max(...Object.values(sc.OPTION_TYPES)) + 1;
sc.MENU_SUBMENU.AZURE_BALANCE = Math.max(...Object.values(sc.MENU_SUBMENU)) + 1;
sc.OPTION_CATEGORY.AZURE_BALANCE = Math.max(...Object.values(sc.OPTION_CATEGORY)) + 1;

sc.OPTION_GUIS[sc.OPTION_TYPES.OPEN_MENU_AZURE] =
    ig.GuiElementBase.extend({
        init(base, size, rowGroup) {
            this.parent();
            this.base = base;
            this.option = base.option;
            this.button = new sc.ButtonGui(ig.lang.get("sc.gui.menu.options-open-menu-button"), size);
            this.button.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_CENTER);
            this.button.data = {
                row: base.row,
                description: base.optionDes
            };
            this.addChildGui(this.button);
            rowGroup.addFocusGui(this.button, 0, base.row);
        },
        onPressed: function (button) {
            if (button == this.button) {
                sc.menu.pushMenu(this.option.menu);
            }
        },
    });

azuretweaks.AzureBalanceMenu = sc.ListInfoMenu.extend({
    transitions: {
        DEFAULT: {
            state: {},
            time: 0.2,
            timeFunction: KEY_SPLINES.EASE_OUT
        },
        HIDDEN: {
            state: {
                alpha: 0,
                scaleX: 0
            },
            time: 0.2,
            timeFunction: KEY_SPLINES.EASE_IN
        }
    },
    init() {
        this.parent(new azuretweaks.AzureBalanceMenuList, null, true);
        this.list.hook.pos.x = 17;
        this.list.hook.pos.y = 11;
        this.doStateTransition("DEFAULT");
        this.onAddHotkeys = () => { };
    },
    showMenu() {
        this.parent();
        this.doStateTransition("DEFAULT");
        this.list.show();
        this.list.doStateTransition("DEFAULT");
        sc.menu.pushBackCallback(() => {
            sc.menu.popBackCallback();
            sc.menu.popMenu();
        });
    },
    hideMenu() {
        this.parent();
        // sc.menu.buttonInteract.removeButtonGroup(this.buttongroup);
        this.doStateTransition("HIDDEN");
        this.list.doStateTransition("HIDDEN");
		
		var changedanyoptions = false;
		for (var v in window.azuretweaks.submenuOptionsToggled)
			if(window.azuretweaks.submenuOptionsToggled[v] != null)
				changedanyoptions = true;
		if (changedanyoptions)
		{
			sc.Dialogs.showYesNoDialog("The game needs to be restarted for changes to take effect. Restart now?", sc.DIALOG_INFO_ICON.QUESTION, button2 => {
				if (button2.data == 0)
				{
					"chrome" in window ? window.chrome.runtime.reload() : window.location.reload();
				}
			})			
		}
    },
});

azuretweaks.AzureBalanceMenuList = ig.GuiElementBase.extend({
	gfx: new ig.Image("media/gui/menu.png"),
    transitions: {
        DEFAULT: {
            state: {},
            time: 0.2,
            timeFunction: KEY_SPLINES.LINEAR
        },
        HIDDEN: {
            state: {
                alpha: 0,
                offsetX: -184
            },
            time: 0.2,
            timeFunction: KEY_SPLINES.LINEAR
        }
    },
    init(b) {
        this.parent(b);
		var width = 230;
		var heightadd = 16;
		
        this.setSize(width, 263);
        this.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
		
		var background = new sc.MenuPanel;
		background.setSize(width, 242 + heightadd);
		background.setPos(0, 21);
		this.addChildGui(background);
		this.bg =
			new sc.MenuScanLines;
		this.bg.setPos(0, 29);
		this.bg.setSize(width, 228 + heightadd);
		this.addChildGui(this.bg);
		background = new ig.ImageGui(this.gfx, 34, 416, 5, 5);
		background.setPos(0, 21);
		this.addChildGui(background);
		background = new ig.ColorGui("#545454", width - 5, 1);
		background.setPos(5, 21);
		this.addChildGui(background);

		this.rowButtonGroup = new sc.RowButtonGroup;
		this.rowButtonGroup.enableMultiPressed = true;
		this.rowButtonGroup.soundsOnPressed = true;
		this.list = new sc.ButtonListBox(1, 1, 28);
		this.list.setPos(0, 29);
		this.list.setSize(width, 228 + heightadd);
		this.list.setButtonGroup(this.rowButtonGroup);
		this.list.hook.transitions = {
			DEFAULT: {
				state: {},
				time: 0.2,
				timeFunction: KEY_SPLINES.LINEAR
			},
			HIDDEN: {
				state: {
					alpha: 0
				},
				time: 0.2,
				timeFunction: KEY_SPLINES.LINEAR
			}
		};
		this.addChildGui(this.list);
		this.rowButtonGroup.isNonMouseMenuInput = this.isNonMouseMenuInput.bind(this);
		this.rowButtonGroup.addSelectionCallback(function (a) {
			a.data && sc.menu.setInfoText(a.data.description ? a.data.description : a.data)
		}
			.bind(this));
		this.rowButtonGroup.setLeftRightCallback(function (a, b) {
			return this.rows[b] ? this.rows[b].onLeftRight(a) : true
		}
			.bind(this));
		this.rowButtonGroup.addPressCallback(function (a) {
			if (a.data && a.data.row !=
				void 0)
				this.rows[a.data.row].onPressed(a)
		}
			.bind(this));
		this.rowButtonGroup.onButtonTraversal = this.onButtonTraversal.bind(this);

		this._createOptionList();
		this.list.activate();
    },
	_createOptionList: function () {
		
		var indent = 10;
		
		var a = [],
		d = null,
		d = null,
		c = false,
		e = 0,
		d = sc.OPTIONS_DEFINITION,
		f;
		for (f in d) {
			d = sc.OPTIONS_DEFINITION[f];
			c = false;
			if (d.cat == sc.OPTION_CATEGORY.AZURE_BALANCE) {
				d.browser ? ig.platform == ig.PLATFORM_TYPES.BROWSER && (c = true) : d.noBrowser ? ig.platform != ig.PLATFORM_TYPES.BROWSER && (c = true) : c = true;
				if (c) {
					d = d.type == "INFO" ? new sc.OptionInfoBox(d, 431) : new sc.OptionRow(f, e, this.rowButtonGroup, this.isLocal, 431);
					this.list.addButton(d, true);
					//d.hook.pos.x += indent;
					for (var child=0; child<4; child++)
						d.hook.children[child].pos.x += indent;
					a[e] = d;
					e++
				}
			}
		}
		this.rows = a
	},
	show() {
        this.list.doStateTransition("DEFAULT");
        this.list.activate();
    },
	isNonMouseMenuInput: function () {
		return sc.control.menuConfirm() || sc.control.rightDown() || sc.control.leftDown() || sc.control.downDown() || sc.control.upDown() || sc.control.menuCircleLeft() ||
		sc.control.menuCircleRight()
	},
	onButtonTraversal: function () {
	},
	modelChanged: function (b,
		a) {
		b == sc.menu && a == sc.MENU_EVENT.OPTION_CHANGED_TAB && this._createCacheList(sc.menu.optionLastButtonData.type, true, ig.input.mouseGuiActive, !ig.input.mouseGuiActive)
	}
});

sc.SUB_MENU_INFO[sc.MENU_SUBMENU.AZURE_BALANCE] = {
    Clazz: azuretweaks.AzureBalanceMenu,
    name: "azure-balance-changes"
};


//add main menu options
sc.ALL_QUEST_TYPE = {
    ALL: 0,
    ONLYFAVORITES: 1
};
let options = {};
for (let [key, value] of Object.entries(sc.OPTIONS_DEFINITION)) {
    options[key] = value;
    switch (key) {
        case "game-sense":
            options["azure-open-balance-menu"] = {
                type: "OPEN_MENU_AZURE",
                menu: sc.MENU_SUBMENU.AZURE_BALANCE,
                cat: sc.OPTION_CATEGORY.GENERAL,
				hasDivider: true,
				header: "azure-tweaks"
            };
            options["all-quest-type"] = {
				type: 'BUTTON_GROUP',
				cat: sc.OPTION_CATEGORY.GENERAL,
				data: sc.ALL_QUEST_TYPE,
				init: 0
            };
            options["enter-map-names"] = {
				type: 'CHECKBOX',
				cat: sc.OPTION_CATEGORY.GENERAL,
				init: true
            };
            options["trader-location-details"] = {
				type: 'CHECKBOX',
				cat: sc.OPTION_CATEGORY.GENERAL,
				init: true
            };
            options["analog-menus"] = {
				type: 'CHECKBOX',
				cat: sc.OPTION_CATEGORY.GENERAL,
				init: true
            };
            options["melee-ranged-res"] = {
				type: 'CHECKBOX',
				cat: sc.OPTION_CATEGORY.GENERAL,
				init: false
            };



            options["azure-balance-arts-visuals"] = {
				type: 'CHECKBOX',
				cat: sc.OPTION_CATEGORY.AZURE_BALANCE,
				init: true,
				hasDivider: true,
				header: "azure-combat-arts"
            };
            options["azure-balance-arts-buffs"] = {
				type: 'CHECKBOX',
				cat: sc.OPTION_CATEGORY.AZURE_BALANCE,
				init: true,
            };
            options["azure-balance-arts-nerfs"] = {
				type: 'CHECKBOX',
				cat: sc.OPTION_CATEGORY.AZURE_BALANCE,
				init: true,
            };
            options["azure-balance-bosses"] = {
				type: 'CHECKBOX',
				cat: sc.OPTION_CATEGORY.AZURE_BALANCE,
				init: true,
				hasDivider: true,
				header: "azure-enemy-changes"
            };
            options["azure-balance-bovines"] = {
				type: 'CHECKBOX',
				cat: sc.OPTION_CATEGORY.AZURE_BALANCE,
				init: true,
            };
            options["azure-balance-timingrings"] = {
				type: 'CHECKBOX',
				cat: sc.OPTION_CATEGORY.AZURE_BALANCE,
				init: true,
            };
            options["azure-balance-enemyvisuals"] = {
				type: 'CHECKBOX',
				cat: sc.OPTION_CATEGORY.AZURE_BALANCE,
				init: true,
            };
            break;
    }
}

window.azuretweaks.submenuOptionsToggled={};
sc.OptionModel.inject({
	set(a, b, c)
	{
		if (a == "azure-balance-arts-visuals" || a == "azure-balance-arts-buffs" || a == "azure-balance-arts-nerfs"
		 || a == "azure-balance-bosses" || a == "azure-balance-bovines" || a == "azure-balance-timingrings"
		  || a == "azure-balance-enemyvisuals")
		{
			//console.warn(a + ": " + b);
			if(window.azuretweaks.submenuOptionsToggled[a] == null)
				window.azuretweaks.submenuOptionsToggled[a] = true;
			else
				window.azuretweaks.submenuOptionsToggled[a] = null;
			
			window.localStorage.setItem(a, b);
		}
		return this.parent(a, b, c);
	},
	get(a, b)
	{
		if (a == "azure-balance-arts-visuals" || a == "azure-balance-arts-buffs" || a == "azure-balance-arts-nerfs"
		 || a == "azure-balance-bosses" || a == "azure-balance-bovines" || a == "azure-balance-timingrings"
		  || a == "azure-balance-enemyvisuals")
		{
			if (window.localStorage.getItem(a) != null)
			{
				return window.localStorage.getItem(a) != "false";
			}
		}
		return this.parent(a, b);		
	}
});

sc.OPTIONS_DEFINITION = options;
