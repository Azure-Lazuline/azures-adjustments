import "./menus.js";

//make baggy-kun in the First Scholars HQ give SP so they can serve their intended purpose.
//entities set to not have an HP bar don't get anywhere *near* the code that adds SP which i guess is why they didn't do this, 
//so a lot needs to be reimplemented or done with special cases...
ig.ENTITY.Combatant.inject({
	onDamage(a, c, g){
		if (this.enemyName == "baggy-kun"){
			var y = a.getCombatant().getCombatantRoot();
			if (y && y.isPlayer && c.spFactor)
            { //reimplement the sp gain from player's onTargetHit since i couldn't figure it out with the available objects
                var spgain = 1 * c.spFactor;
                var foc = y.params.getStat("focus");
                spgain = spgain * (0.75 + Math.pow(foc / 400, 0.75));
                spgain = spgain * c.spRepeatFactor;
                c.spRepeatFactor = 0;
				if(!isNaN(spgain)){ //just in case...
					y.params.addSp(spgain * 0.1);
				}
			}
		}
		return this.parent(a, c, g);
	}
});

//hide pets in plot-important areas so you don't have fucking Doge dancing around while someone commits suicide onscreen
sc.PlayerPetEntity.inject({
	shouldTempHide(){
		if(!this.checkedMap)
		{
			var mapname = ig.vars.currentLevelName;
			//console.warn(mapname);
			this.checkedMap = true;
			this.hideOnThisMap = false;
			if (mapname.startsWith("hideout") || mapname.startsWith("arid") || mapname.startsWith("aridDng") 
				|| mapname.startsWith("dream") || mapname.startsWith("finalDng/b4/boss")
				|| mapname.startsWith("bergenTrail/excluded") || mapname.startsWith("evoVillage/interior/glasses")
				|| mapname.startsWith("autumnFall/raid")) this.hideOnThisMap = true;
		}
		return this.parent() || this.hideOnThisMap;
	}
});
ig.ENTITY.Player.inject({
	doPetAction()
	{
		if (this.skin.pet && this.skin.pet.shouldTempHide)
		{
			return;
		}
		else
			this.parent();
	}
});

//make traders unlock in the trader book from just passing by the NPC (so the list pops up) instead of needing to actually interact,
//i've seen a lot of people assume this is how it works anyway until they get messed up by it later
sc.TradeInfo.inject({
	init(b, a){
		this.parent(b, a);
		this.iconGui.parentInfo = this;
	},
	startTradeMenu()
	{
		sc.trade.azureCurrentTrader = this.key;
		this.parent();
	}
});
sc.TradeIconGui.inject({
	setIconState(b){
		if (b == sc.INTERACT_ENTRY_STATE.FOCUS && this.parentInfo)
			sc.trade.unlockTrader(this.parentInfo.key, this.parentInfo.entity.characterName);
		this.parent(b);
	}
});

//list changing modifiers first on the equipment interface
sc.EquipStatusContainer.inject({
	_setParameters(a, d){
		this.comparingstats = true;
		
		//modifiers are shown in the order that allModifiers happens to be, which groups them by type
		if (this.allModifiersBackup == null) //keep backup of the original order so it can be changed
			this.allModifiersBackup = this.allModifiers;
			
		//copypasted code from the parent function to get some necessary info
		var b = {
			params:
			{
				elemFactor: [1, 1, 1, 1]
			},
			properties:
			{}
		};
		var c = null,
			e = a != -1E3 ? sc.inventory.getItem(a) : b;
		if (this.compareMode) switch (e.equipType)
		{
			case sc.ITEMS_EQUIP_TYPES.HEAD:
				c =
					sc.model.player.equip.head;
				break;
			case sc.ITEMS_EQUIP_TYPES.ARM:
				c = this.compareOffHand ? sc.model.player.equip.leftArm : sc.model.player.equip.rightArm;
				break;
			case sc.ITEMS_EQUIP_TYPES.TORSO:
				c = sc.model.player.equip.torso;
				break;
			case sc.ITEMS_EQUIP_TYPES.FEET:
				c = sc.model.player.equip.feet
		}
		else switch (sc.menu.currentBodyPart)
		{
			case sc.MENU_EQUIP_BODYPART.NONE:
				return;
			case sc.MENU_EQUIP_BODYPART.HEAD:
				c = sc.model.player.equip.head;
				break;
			case sc.MENU_EQUIP_BODYPART.RIGHT_ARM:
				c = sc.model.player.equip.rightArm;
				break;
			case sc.MENU_EQUIP_BODYPART.LEFT_ARM:
				c = sc.model.player.equip.leftArm;
				break;
			case sc.MENU_EQUIP_BODYPART.TORSO:
				c = sc.model.player.equip.torso;
				break;
			case sc.MENU_EQUIP_BODYPART.FEET:
				c = sc.model.player.equip.feet
		}
		var g = sc.model.player.equipModifiers;
			
			
			
		var item = sc.inventory.getItem(c);
		
		this.allModifiers = {};
		var y = 8;
		for (var i in this.allModifiersBackup){
			if ((item && item.properties.hasOwnProperty(i)) || (e && e.properties.hasOwnProperty(i)))
			{ //if the property exists in the new item, or on the old item that's replacing, add it to the list
				this.allModifiers[i] = this.allModifiersBackup[i];
				this.allModifiers[i].annotation.index.y = y; //help menu sort order
				y++;
			}
		}
		//then add the rest
		for (var i in this.allModifiersBackup){
			if (!this.allModifiers[i])
			{
				this.allModifiers[i] = this.allModifiersBackup[i];
				this.allModifiers[i].annotation.index.y = y; //help menu sort order
				y++;
			}
		}
		
		this.parent(a, d);
		
		this.comparingstats = null;
	}
});
sc.EquipStatusContainer.inject({
	_resetChangeValue(a){
		if	(this.allModifiersBackup != null && !this.comparingstats)
		{ //if backing out of the comparison menu, restore the canonical order
			var y = 8;
			this.allModifiers = {};
			for (var i in this.allModifiersBackup){
				this.allModifiers[i] = this.allModifiersBackup[i];
				this.allModifiers[i].annotation.index.y = y; //help menu sort order
				y++;
			}
		}
		this.parent(a);
	}
});


//keep your compare mode setting when switching between different trades
sc.TradeModel.inject({
	setEquipID(b, a)
	{
		var mode = this.compareMode;
		this.parent(b, a);
		this.compareMode = mode;

		//if you swapped tabs to a non-weapon when comparing to offhand, swap to compare to main
		var item = sc.inventory.getItem(this.equipID);
		if (item && item.equipType != sc.ITEMS_EQUIP_TYPES.ARM && this.compareMode == sc.TRADE_COMPARE_MODE.OFF_HAND)
			this.compareMode = sc.TRADE_COMPARE_MODE.EQUIP;
		sc.Model.notifyObserver(this, sc.TRADE_MODEL_EVENT.COMPARE_MODE_CHANGED)
	}
});

//text replacements
window.azuretweaks.textReplace=function(message)
{
	//"Al" and "AI" both being used frequently was very confusing to me when the font makes them exactly identical, and one of them is a core theme of the game
	message = message.replace("Al ", "Albert ");
	message = message.replace("Al.", "Albert.");
	message = message.replace("Al,", "Albert,");
	message = message.replace("Al!", "Albert!");
	message = message.replace("Al?", "Albert?");
	message = message.replace("Al\\c", "Albert\\c");

	//this typo(?) always bugged me
	message = message.replace("I wonder if those enemies are supposed to be Turtles and Tortoise.", "I wonder if those enemies are supposed to be Turtles or Tortoises.");
	
	return message;
}
ig.EVENT_STEP.SHOW_MSG.inject({
	init(a) {
		if(a.message && a.message.en_US)
			a.message.en_US = window.azuretweaks.textReplace(a.message.en_US);

		this.parent(a);
	},
});
ig.EVENT_STEP.SHOW_SIDE_MSG.inject({
	init(a) {
		if(a.message && a.message.en_US)
			a.message.en_US = window.azuretweaks.textReplace(a.message.en_US);

		this.parent(a);
	},
});


//disallow text skipping in situations where it's easy to do on accident
//(also includes other stuff that needed a player update inject)
ig.ENTITY.Player.inject({
  update(...args) {
	  if(ig.ENTITY.Player.notextskiptime){
		  ig.ENTITY.Player.notextskiptime -= 1 * ig.system.tick;
		  if(ig.ENTITY.Player.notextskiptime < 0) ig.ENTITY.Player.notextskiptime = null;
	  }
	  if(ig.ENTITY.Player.resumeMusicOnceCutsceneEnds && !sc.model.isCutscene())
	  {
			ig.ENTITY.Player.resumeMusicOnceCutsceneEnds = null;
			ig.bgm.resumeDefault("SLOW");
	  }
      return this.parent(...args);
  },
});
sc.MsgBoxGui.inject({
	skip() {
		if(ig.ENTITY.Player.notextskiptime)
		{
			//do nothing
		}
		else
			this.parent();
	},
});
sc.MessageModel.inject({
	onPreUpdate() {
		if(this.autoContinue)
		{
			ig.ENTITY.Player.notextskiptime = 0.5; //no skip during auto-advancing message or first x seconds afterwards
		}
		this.parent();
	},
});
sc.DreamMsgGui.inject({
	onInteraction() {
		if(!this.textDone)
		{
			//do nothing
		}
		else
			this.parent();
	},
});

//force scaling in Arena cups. EL's Tweaks has similar functionality, implemented in a different way - i just wanted something basic.
//this gets disabled if EL's Tweaks is active though since that one has a UI to toggle it, and some bugfixes i think.
//theirs might override this anyway depending on load order, since they don't use proper injection syntax and just clobber the whole function... ah well
sc.Arena.inject({
    hasAscendedChallenge(a) {
		var hasElTweaks = false;
		for (var c=0;c<window.activeMods.length;c++)
		{
			if (window.activeMods[c].name == "el-tweaks")
				hasElTweaks = true;
		}
		if (!hasElTweaks)
			return true;

        return this.parent(a);
    }
});

//reduce SP gain when certain barrier arts are active (using a new attachedSpMultiplier parameter for proxies and shields)
sc.CombatProxyEntity.inject({
	init(a, b, d, g)
	{
		if (g.data) 
			this.attachedSpMultiplier = g.data.attachedSpMultiplier;
		
		this.parent(a, b, d, g);
	}
});
ig.ACTION_STEP.ADD_SHIELD.inject({
	init(a)
	{
		this.parent(a);
		this.shield.attachedSpMultiplier = a.attachedSpMultiplier;
	}
});
sc.CombatParams.inject({
	addSp(a, b)
	{
		if (this.combatant && this.combatant.isPlayer)
		{
			var mult = 1;
			for (var c in this.combatant.entityAttached)
			{ //take the lowest SP multiplier out of all attached entities
				var newmult = this.combatant.entityAttached[c].attachedSpMultiplier;
				if (newmult && newmult < mult)
					mult = newmult;
			}
			for (var c in this.combatant.shieldsConnections)
			{ //take the lowest SP multiplier out of all attached shields too
				if(this.combatant.shieldsConnections[c].shield)
				{
					var newmult = this.combatant.shieldsConnections[c].shield.attachedSpMultiplier;
					if (newmult && newmult < mult)
						mult = newmult;
				}
			}
			a *= mult;
		}
		this.parent(a, b);
	}
});

//respawn dungeon enemies faster
ig.ENTITY.EnemySpawner.inject({
	update(){
		this.parent();
		
		if (!this.checkedMap)
		{
			var mapname = ig.vars.currentLevelName;
			this.checkedMap = true;
			this.isInDungeon = false;
			if (mapname.startsWith("coldDng") || mapname.startsWith("heatDng") || mapname.startsWith("shockDng")
				|| mapname.startsWith("waveDng") || mapname.startsWith("finalDng")) this.isInDungeon = true;
			//console.warn(mapname);
			//console.warn(this.isInDungeon ? "dungeon" : "not dungeon");
		}
		if (this.isInDungeon && this.respawnTimer > 45) //45 seconds max respawn (instead of 3 minutes)
			this.respawnTimer = 45;
	}
});

//thing to help me debug enemies better
/*sc.EnemyType.inject({
	switchState(b, c){
		console.warn("state: " + c);
		this.parent(b, c);
	}
});*/

//implement "NO_BOMB_HOMING" hint for fire attacks that don't send bombs directly towards you
sc.BombEntity.inject({
	ballHit(a){
		if(a.attackInfo.hasHint("NO_BOMB_HOMING"))
		{
			var backup = a.attackInfo;
			a.attackInfo.hints = ["CHARGED"];
			var ret = this.parent(a);
			a.attackInfo = backup;
			return ret;
		}
		else
			return this.parent(a);
	}
});

//fix music triggers in Vermillion Cup rush mode. It used to overwrite the music when you got to the turrets. This is a bit hacky but i don't feel it's practical for a patch file...
//they forgot the "not rush mode" conditional on the play music trigger for the turrets even though they remembered it for "fade out previous track", which is why it's so sudden
ig.EVENT_STEP.PLAY_BGM.inject({
	run()
	{
		if (ig.vars.currentLevelName=="arena/dlc/turrets")
		{
			//do nothing
			return true;
		}
		else
		{
			return this.parent();
		}
	}
});
//the turret music is definitely a bug but they intentionally made the Snail and Designer music not play - but at least for the Designer i feel it should
ig.EVENT_STEP.IF.inject({
	init(a)
	{
		this.parent(a);
		if (ig.vars.currentLevelName=="arena/dlc/designer" && a.condition == "!arena.isRush")
		{
			this.condition = new ig.VarCondition("true");
		}
	}
});

//fix cases where the Prepare to Hi modifier can make you die in the arena from something that's supposed to not hurt you (the noDmg limiter)
ig.ENTITY.Player.inject({
	onDamage(a, c, g)
	{
		if (c && c.limiter)
			ig.limiterForLastPlayerHit = c.limiter; //save limiters globally

		var ret = this.parent(a, c, g); //because it's needed somewhere in here, in the part that calls the arena code below...
		ig.limiterForLastPlayerHit = null; //then delete them so they don't spill over into other damage checks
		return ret;
	}
});
sc.Arena.inject({
	onPreDamageModification(...args)
	{
		if(ig.limiterForLastPlayerHit && ig.limiterForLastPlayerHit.noDmg)
		{
			return; //exit instead of running the rest of the code
		}
		else
		{
			this.parent(...args);
		}
	}
});

//fix the inconsistency in arena stats. Damage Taken used to always say "x25" instead of how much you actually took.
//all other stats showed the actual stat there, but Damage Taken showed the multiplier, which was much less useful and it was inconsistent.
//also applies this to the "HP Recovered" stat from EL's Tweaks that makes platinum medals completely free in case anyone has that toggled
sc.ArenaSummary.inject({
	_addEntry(a, b, d)
	{
		var ret = this.parent(a, b, d);
		if (a == "DAMAGE_TAKEN") ret.keyGui.setText("\\c[1]Damage Taken\\i[timesRed]" + (b.value/-25) + "\\c[0]");
		if (a == "DAMAGE_HEALED") ret.keyGui.setText("\\i[insetArrow]\\c[2]HP Recovered\\i[timesGreen]" + (b.value/15) + "\\c[0]");
		return ret;
	}
});

//on controller, set trade menu to highlighting the item by default instead of the trade button, so you can read the description without needing to manually scroll to it each time
sc.TradeDialogMenu.inject({
	_createContent()
	{
		this.parent();
		this._setOffer();
	},
	_setOffer()
	{
		this.parent();
		if(!ig.input.mouseGuiActive)
		{
			this.buttongroup.focusCurrentButton(0, 1, false, true);
		}
	}
});

//add "where to get" to trade menu instead of buried five submenus deep
sc.AzureTradeLocations = ig.BoxGui.extend({
	transitions: {
		DEFAULT: {
			state: {},
			time: 0.2,
			timeFunction: KEY_SPLINES.EASE
		},
		HIDDEN: {
			state: {
				alpha: 0,
				offsetX: -10
			},
			time: 0.2,
			timeFunction: KEY_SPLINES.LINEAR
		}
	},
	ninepatch: new ig.NinePatch("media/gui/menu.png", {
		width: 8,
		height: 8,
		left: 8,
		top: 8,
		right: 8,
		bottom: 8,
		offsets: {
			"default": {
				x: 456,
				y: 280
			},
			changes: {
				x: 480,
				y: 280
			}
		}
	}),
	titleOffset: 8,
	lineOffset: 4,
	level: 0,
	isScalable: false,
	init: function (b, a) {
		this.parent(136, 266);
		this.setPos(41, 27);
		this.hook.localAlpha = 0.9;
		this.titleOffset = b == void 0 ? 8 : b;
		this.lineOffset = a == void 0 ? 4 : a;
		this._createContent();
		this.doStateTransition("HIDDEN", true);
		
		this.hiddenBaseMenu = new sc.ItemStatusTrade;
	},
	updateDrawables: function (b) {
		this.parent(b);
		b.addColor("#7E7E7E", 2, 12, this.hook.size.x - 4, 1);
		//b.addColor("#7E7E7E", 2, 38, this.hook.size.x - 4, 1);
		//b.addColor("#7E7E7E", 2, 162, this.hook.size.x - 4, 1)
	},
	showMenu: function () {
		sc.Model.removeObserver(sc.trade, this);
		sc.Model.addObserver(sc.trade, this);
	},
	hideMenu: function () {
		sc.Model.removeObserver(sc.trade, this);
		this.doStateTransition("HIDDEN");
	},
	_createContent: function () {
		var b = this.lineOffset,
		a = 5;
		this.compareText = new sc.TextGui(ig.lang.get("sc.gui.menu.item.availability"), {
			font: sc.fontsystem.tinyFont
		});
		this.compareText.setPos(this.titleOffset, a);
		this.addChildGui(this.compareText);

		this.content = new ig.GuiElementBase;
		this.content.setSize(124, 140);
		this.content.setPos(1, 10);
		this.addChildGui(this.content);
	},
	_setTradeInfo: function (a) {
		if (this.content)
		{
			this.removeChildGui(this.content);
		}
		var item = sc.inventory.getItem(a);
		var backup = item.sources;
		item.sources = []; //clear it and check enemies and traders manually, for more accurate info
		
		var rescanTraders = true;
		var rescanEnemies = true;
		if (backup != null)
		{
			for (var c=0;c<backup.length;c++)
			{
				if (backup[c].type == "OTHER" && backup[c].value.icon == "TRADER")
				{
					rescanTraders = false; //there's already something like "Traders in all major cities" so don't grab individual ones
					rescanEnemies = false;
				}
			}
		}

		if (rescanEnemies)
		{
			//check enemy drops
			for (var c in sc.combat.enemyDataList)
			{
				for (var dropnum=0; dropnum<sc.combat.enemyDataList[c].itemDrops.length; dropnum++)
				{
					if (sc.combat.enemyDataList[c].itemDrops[dropnum].item == a
						&& !sc.combat.enemyDataList[c].itemDrops[dropnum].boosted
						&& sc.combat.enemyDataList[c].track && !sc.combat.enemyDataList[c].boss)
					{
						item.sources.push({"type": "ENEMY", "value": c, "sortOrder": sc.combat.enemyDataList[c].order});
					}
				}
			}
		}

		if (rescanTraders)
		{
			//check traders
			var numtraders = 0;
			for (var c in sc.trade.tradersFound)
			{
				var isObsoletedByUpgrade = false;
				for (var other in sc.trade.tradersFound)
				{
					if (c == sc.trade.traders[other].upgradeTo)
					{
						isObsoletedByUpgrade = true;
					}
				}
				for (var optionnum=0; optionnum<sc.trade.traders[c].options.length; optionnum++)
				{
					if (sc.trade.traders[c].options[optionnum].get[0].id == a && sc.trade.traders[c].area != "arid"
						&& !isObsoletedByUpgrade)
					{
						if (this.getBaseTrader(c) == this.getBaseTrader(sc.trade.azureCurrentTrader))
						{
							var text = "Me";
							var subtext = "Right here";
							item.sources.push({
									"type": "OTHER",
									"value": {
										"icon": "TRADER",
										"text": { "en_US": text, "zh_CN": text, "ja_JP": text, "ko_KR": text, "de_DE": text, "zh_TW": text },
										"subText": { "en_US": subtext, "zh_CN": subtext, "ja_JP": subtext, "ko_KR": subtext, "de_DE": subtext, "zh_TW": subtext },
										"arrow": true,
										"type": "TRADER",
										"value": "rookieSets"
									}
								}
							);							
						}
						else
							item.sources.push({"type": "TRADER", "value": c, "sortOrder": sc.trade.traders[c].order});
						numtraders++;
					}
				}
			}
			if (numtraders > 6)
			{
				//console.warn(numtraders + " traders total");
				for (var i=0;i<numtraders;i++)
					item.sources.pop(); //get rid of them all
				
				//replace with the generic "there's a lot of them"
				item.sources.push({
					"type": "OTHER",
					"value": {
						"icon": "TRADER",
						"text": {
							"en_US": "\\c[3]Traders\\c[0] in Major Cities",
							"zh_CN": "\u4e3b\u8981\u57ce\u5e02\u4e2d\u7684\\c[3]\u5546\u4eba\\c[0]<<A<<[CHANGED 2018\/07\/09]",
							"ja_JP": "\u5927\u90fd\u5e02\u306e\\c[3]\u30c8\u30ec\u30fc\u30c0\u30fc\\c[0]<<A<<[CHANGED 2018\/07\/09]",
							"ko_KR": "\uc8fc\uc694 \ub3c4\uc2dc\uc758 \\c[3]\uc0c1\uc778\\c[0]<<A<<[CHANGED 2018\/07\/09]",
							"de_DE": "\\c[3]H\u00e4ndler\\c[0] in Gro\u00dfst\u00e4dten",
							"zh_TW": "\u4e3b\u8981\u57ce\u5e02\u4e2d\u7684\\c[3]\u5546\u4eba\\c[0]<<A<<[CHANGED 2018\/07\/09]"
						},
						"type": "TRADER",
						"value": "rookieSets"
					}
				});
				item.sources.push({
					"type": "OTHER",
					"value": {
						"icon": "TRADER",
						"text": {
							"en_US": "\\c[3]Player Traders\\c[0] in all Areas",
							"zh_CN": "\u6240\u6709\u533a\u57df\u4e2d\u7684\\c[3]\u73a9\u5bb6\u5546\u4eba\\c[0]<<A<<[CHANGED 2018\/07\/09]",
							"ja_JP": "\u3059\u3079\u3066\u306e\u30a8\u30ea\u30a2\u306e\\c[3]\u30d7\u30ec\u30a4\u30e4\u30fc\u30c8\u30ec\u30fc\u30c0\u30fc\\c[0]<<A<<[CHANGED 2018\/07\/09]",
							"ko_KR": "\ubaa8\ub4e0 \uc9c0\uc5ed\uc758 \\c[3]\ud50c\ub808\uc774\uc5b4 \uc0c1\uc778\\c[0]<<A<<[CHANGED 2018\/07\/09]",
							"de_DE": "\\c[3]Spieler-H\u00e4ndler\\c[0] allerorten",
							"zh_TW": "\u6240\u6709\u5340\u57df\u4e2d\u7684\\c[3]\u73a9\u5bb6\u5546\u4eba\\c[0]<<A<<[CHANGED 2018\/07\/09]"
						},
						"type": "TRADER",
						"value": "rookieSets"
					}
				});
			}
		}
		
		if (backup != null)
		{
			//then add in all the others
			for (var c=0;c<backup.length;c++)
			{
				if ((backup[c].type != "ENEMY" || !rescanEnemies) && (backup[c].type != "TRADER" || !rescanTraders))
				{
					backup[c].sortOrder = 0;
					item.sources.push(backup[c]);
				}
			}
		}
		
		for (var c=0; c<item.sources.length; c++)
		{
			var type = item.sources[c].type;
			if (type == "ENEMY") item.sources[c].sortOrder += 0;
			if (type == "PLANT") item.sources[c].sortOrder += 10000;
			if (type == "QUEST") item.sources[c].sortOrder += 20000;
			if (type == "CHEST") item.sources[c].sortOrder += 30000;
			if (type == "TRADER") item.sources[c].sortOrder += 40000;
			if (type == "OTHER") item.sources[c].sortOrder += 50000;
		}
		
		item.sources.sort(function(a, b){return a.sortOrder-b.sortOrder});
		
		var max = 13;
		if (item.sources.length > max)
		{
			var numextra = 0;
			while (item.sources.length >= max)
			{
				item.sources.shift();
				numextra++;
			}

			var icon = "OTHER";
			var text = "+" + numextra + " more locations";
			
			item.sources.push({
					"type": "OTHER",
					"value": {
						"icon": icon,
						"text": { "en_US": text, "zh_CN": text, "ja_JP": text, "ko_KR": text, "de_DE": text, "zh_TW": text },
						"type": "ENEMY",
						"value": "hedgehog"
					}
				}
			);
		}
		
		if (item.sources.length == 0)
		{
			var icon = "OTHER";
			var text = "???";
			
			item.sources.push({
					"type": "OTHER",
					"value": {
						"icon": icon,
						"text": { "en_US": text, "zh_CN": text, "ja_JP": text, "ko_KR": text, "de_DE": text, "zh_TW": text },
						"type": "ENEMY",
						"value": "hedgehog"
					}
				}
			);
		}

		this.hiddenBaseMenu._setTradeInfo(a);
		item.sources = backup;

		this.content = this.hiddenBaseMenu.content;
		this.content.setSize(124, 140);
		this.content.setPos(1, 14);
		for (var i=0; i<this.content.hook.children.length; i++)
		{
			var text = this.content.getChildGuiByIndex(i).gui.textEntry.text;
			if (text == "Loot Gaia's Garden West" || text == "Loot Gaia's Garden East")
				this.content.getChildGuiByIndex(i).gui.textEntry.setText("Trader"); //fix overflow text issue and confusing name
		}
		this.addChildGui(this.content);
	},
	getBaseTrader(c)
	{
		if (sc.trade.traders[c].upgradeTo != null)
			return this.getBaseTrader(sc.trade.traders[c].upgradeTo);
		return c;
	}
})
sc.TradeMenu.inject({
	init(b)
	{
		this.parent(b);
		this.tradeLocations = new sc.AzureTradeLocations;
		this.addChildGui(this.tradeLocations);
		this.tradeDialog.baseMenu = this;
	},
	onItemHighlighted(b)
	{
		var showLocationsOf = null;
		if (b.data && !b.isTrade)
		{
			var item = sc.inventory.getItem(b.data.id);
			if (item)
			{
				showLocationsOf = b.data.id;
			}
		}
		if (!sc.options.get("trader-location-details"))
			showLocationsOf = null;
		
		if (showLocationsOf != null)
		{
			this.tradeLocations._setTradeInfo(showLocationsOf);
			this.tradeLocations.doStateTransition("DEFAULT", false);
			this.tradeStats.hideMenu();
		}
		else
		{
			this.tradeLocations.doStateTransition("HIDDEN", false);
			this.tradeStats.showMenu();
		}		
	},
	_exitMenu()
	{
		this.parent();
		this.tradeLocations.doStateTransition("HIDDEN", false);
	}
});
sc.TradeDialogMenu.inject({
	onSelection(b)
	{
		if (this.baseMenu != null)
			this.baseMenu.onItemHighlighted(b);
		this.parent(b);
	}
});


//make flying enemies not follow you into the air when you're doing Flare Burn etc
sc.PlayerAction.inject({
	init(a, c, e){
		this.parent(a, c, e);
		if (c)
		{
			if (c.dontFollowZ)
			{
				this.action.dontFollowZ = true; //custom property. You can add it to your own actions in their root, next to dmgType and stunType
			}
		}
	}
});
ig.ENTITY.Enemy.inject({
	update(){
		var dontFollowZ = false;

		var target = this.getTarget();
		if (!this.isPlayer && target && target.isPlayer && !target.jumping && target.currentAction)
		{
			if (target.currentAction.dontFollowZ)
				dontFollowZ = true;
		}
		
		if (this.isParrot == null)
		{
			this.isParrot = false;
			if (this.enemyName == "jungle.parrot" || this.enemyName == "jungle.special.parrot-gangster-1"
			 || this.enemyName == "jungle.special.parrot-gangster-2" || this.enemyName == "jungle.special.parrot-gangster-boss-1")
				this.isParrot = true;
		}
		if (this.isParrot) dontFollowZ = false; //parrots still do it since they're jerks
		
		//the code responsible for no-z-tracking is somewhere very difficult to access. There's already the "jumping" property that makes them not follow,
		//but that's read in a dozen other places so i don't feel confident that setting it directly during Flare Burn won't break something. So i did it like this
		if (dontFollowZ)
		{
			target.jumping = true; //temporarily set Lea to "jumping" so that vertical tracking is turned off during this.parent
			this.parent();
			target.jumping = false; //then restore it
		}
		else
		{
			this.parent();
		}
	}
});

//new map stamps
sc.StampGui.inject({
	init(...args){
		this.parent(...args);
		this.gfx = new ig.Image("media/gui/newstamps.png");
	}
});
sc.StampGui.inject({
	updateDrawables(a){
		a.addGfx(this.gfx, 1, 1, this.icon.x * 8, this.icon.y * 8, 8, 8);
	}
});
sc.StampMenuButton.inject({
	init(a){
		this.parent(a);
		this.removeChildGui(this.iconGui); //remove old one
		//make new one
		this.icons = new ig.Image("media/gui/newstamps.png");
		this.iconGui = new ig.ImageGui(this.icons, this.icon.x * 8, this.icon.y * 8, 8, 8);
		this.iconGui.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
		this.addChildGui(this.iconGui);
	}
});


//location box when you enter a new area
ig.Game.inject({
	loadingComplete(...args){
		this.parent(...args);
		sc.gui.azureLocationBox.hide();
		sc.gui.azureLocationBox.showDelay = 1;
		sc.gui.azureLocationBox.hideDelay = 1;
	}
});
ig.Game.inject({
	update(...args){
		if (sc.gui.azureLocationBox)
		{
			sc.gui.azureLocationBox.globalUpdate();
		}
		return this.parent(...args);
	}
});
sc.QuickMenuModel.inject({
	enterQuickMenu(...args){
		sc.gui.azureLocationBox.hide();
		this.parent(...args);
	}
});
ig.EVENT_STEP.TELEPORT.inject({
	start(){
		sc.gui.azureLocationBox.hide();
		return this.parent();
	}
});
sc.AzureLocationBox = ig.BoxGui.extend({
	ninepatch: new ig.NinePatch("media/gui/menu.png", {
		width: 4,
		height: 4,
		left: 4,
		top: 4,
		right: 4,
		bottom: 4,
		offsets: {
			"default": {
				x: 544,
				y: 481
			}
		}
	}),
	transitions: {
		HIDDEN: {
			state: {
				alpha: 0,
				offsetX: -20,
				scaleY: 1
			},
			time: 0.3,
			timeFunction: KEY_SPLINES.EASE_IN
		},
		DEFAULT: {
			state: {
				alpha: 0.9,
				scaleY: 1
			},
			time: 0.3,
			timeFunction: KEY_SPLINES.EASE_OUT
		}
	},
	hidden: false,
	location: null,
	location2: null,
	showDelay: null,
	hideDelay: null,
	lastLocation: null,
	init: function () {
		this.parent(188, 20);
		this.setPos(14, 282);
		this.location = new sc.TextGui("", { font: sc.fontsystem.smallFont });
		this.location2 = new sc.TextGui("", { font: sc.fontsystem.smallFont });
		this.location.setPos(16, 0);
		this.location2.setPos(16, 10);
		this.addChildGui(this.location);
		this.addChildGui(this.location2);
		this.doStateTransition("HIDDEN", false);
		this.hook.pauseGui = true;
		this.hidden = false;
	},
	globalUpdate: function() {
		if (this.showDelay)
		{
			if (!this.isBlocked())
			{
				this.showDelay -= ig.system.tick / 0.5;
				if(this.showDelay <= 0)
				{
					this.showDelay = null;
					this.show();
				}
			}
			else
				this.showDelay = 1;
		}
		else if (this.hideDelay)
		{
			this.hideDelay -= ig.system.tick / 3.0;
			if(this.hideDelay <= 0)
			{
				this.hideDelay = null;
				this.hide();
			}
		}
		if (!this.hidden && this.isBlocked())
		{
			this.hide();
		}
	},
	isBlocked: function() {
		return sc.model.isCutscene()
		|| sc.model.message && sc.model.message.isSideMessageVisible();
	},
	updateDrawables: function (a) {
		this.parent(a);
		a.addGfx(this.ninepatch.gfx, 4, 6, 480, 224, 9, 11);
	},
	show: function (a) {
		var mapname = ig.vars.currentLevelName;
		//console.warn(mapname);
		var notOnThisMap = false;
		if (mapname.startsWith("bergenTrail/excluded") || mapname.startsWith("aridDng/first/room10") || mapname.startsWith("aridDng/second/f4")
			|| mapname.startsWith("aridDng/second/f99") || mapname.startsWith("aridDng/second/elevator") || mapname.startsWith("cargoShip")
			|| mapname.startsWith("autumnFall/raid/raidBoss") || mapname.startsWith("beach/apeArena") || mapname.startsWith("coldDng/g/boss")
			|| mapname.startsWith("finalDng/b4/boss") || mapname.startsWith("heatDng/f4/boss") || mapname.startsWith("hideout")
			|| mapname.startsWith("rhombusDng/boss") || mapname.startsWith("shockDng/f3/roomBoss") || mapname.startsWith("treeDng/f4")
			|| mapname.startsWith("waveDng/b1/boss") || mapname.startsWith("metaSpace") || mapname.startsWith("jungle/dng/treeExpo")
			|| mapname.startsWith("dream") || mapname.startsWith("arid/interior") || mapname.startsWith("finalDng/b4/credits")
			|| mapname.startsWith("finalDng/g/roomS-4") || mapname.startsWith("finalDng/b1/bridgeMidboss")
			|| mapname.startsWith("finalDng/g/roomW3-3") || mapname.startsWith("finalDng/g/roomE3-3") || mapname.startsWith("finalDng/b3/roomC1")
			|| mapname.startsWith("finalDng/b2/roomE9Guardian") || mapname.startsWith("finalDng/b2/roomW9Guardian")) 
				notOnThisMap = true;
				
		var currentarea = sc.map.getCurrentAreaName() + sc.map.getCurrentMapName();
		
		if (!notOnThisMap && !sc.arena.active && this.lastlocation != currentarea && sc.options.get("enter-map-names"))
		{
			this.hidden = false;
			this.updateLocationName();
			this.hook.stateCallback = null;
			this.doStateTransition("DEFAULT", false);
		}
		this.lastlocation = currentarea;
	},
	hide: function (a) {
		this.hidden = true;
		this.showDelay = null;
		this.hideDelay = null;
		this.doStateTransition("HIDDEN", false);
	},
	forceHide: function () {
		this.hidden = true;
		this.showDelay = null;
		this.hideDelay = null;
		this.hook.stateCallback = null;
		this.doStateTransition("HIDDEN", false);
	},
	updateLocationName: function () {
		this.location.setText(sc.map.getCurrentAreaName() + ":");
		this.location2.setText(sc.map.getCurrentMapName());
		this.setSize(Math.max(this.location.hook.size.x, this.location2.hook.size.x) + 20, 24);
		this.hook.pivot.y = this.hook.size.y / 2;
	}
});
sc.CrossCode.inject({
    init() {
        this.parent();
        sc.gui.azureLocationBox = new sc.AzureLocationBox;
		ig.gui.addGuiElement(sc.gui.azureLocationBox);
    }
});

//make "teleport ready" prompt from the NG+ landmark teleport modifier go away after 1 second, and also not appear in cutscenes.
//i don't think anyone uses this NG+ modifier except me but it was very annoying visually, there'd be like five minute stretches where it just says "teleport ready" the whole time
ig.GUI.ARBox.inject({
	init(b, a, d, c, e){
		if(b == ig.game.playerEntity && a == "Teleport ready!")
		{
			d = 1; //1 second timer
		}
		this.parent(b, a, d, c, e);
	}
});
ig.ENTITY.TeleportCentral.inject({
	detectClosePlayer(){
		return this.parent() && !sc.model.isCutscene();
	}
});

//resume heat/wave/shock dungeon music after getting the element (since you're about to spend 10 minutes checking out the skill tree in silence otherwise)
//Done this way to prevent conflicts with mods that change those rooms like XPC
ig.EVENT_STEP.RESET_SKILL_TREE.inject({
	start(){
		this.parent();
		if (this.element == 2 && ig.vars.currentLevelName.startsWith("heatDng")
			|| this.element == 4 && ig.vars.currentLevelName.startsWith("shockDng")
			|| this.element == 3 && ig.vars.currentLevelName.startsWith("waveDng"))
			{
				ig.ENTITY.Player.resumeMusicOnceCutsceneEnds = true;
			}
	}
});

sc.StatsListBox.inject({
	onContentCreation()
	{
		delete sc.STATS_BUILD[sc.STATS_CATEGORY.GENERAL].assistTime;
		return this.parent();
	}
});

//add ability to set favorites directly from the item menu
sc.QuickItemMenu.inject({
	onMouseFocus(b)
	{
		this.lastmousefocus = b;
	},
	init(...args){
		this.parent(...args);
		this.buttongroup.addSelectionCallback(this.onMouseFocus.bind(this));
		this.setSize(175, 151);
		for (var i=2; i<=5; i++)
		{
			var gui = this.hook.getChildGuiByIndex(this.hook.children.length - i).gui;
			gui.setPos(gui.hook.pos.x, gui.hook.pos.y + 2);
		}
		//this.removeChildGuiByIndex(this.hook.children.length - 2);

		var favekey = "\\i[help2]";
		if (ig.input.mouseGuiActive)
			favekey = "\\i[help2]";
		
		var pos = {x: 19, y: 4};
		var buttontext = new sc.TextGui(favekey, {});
		buttontext.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
		buttontext.setPos(pos.x - 12, pos.y - 4);
		this.addChildGui(buttontext);

		var favetext = new sc.TextGui(" favorite", {
			font: sc.fontsystem.tinyFont
		});
		favetext.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
		favetext.setPos(pos.x + 2, pos.y);
		this.addChildGui(favetext);
	},
	update(){
		var item = this.buttongroup.getCurrentElement();
		var faveButtonPressed = sc.control.menuHotkeyHelp2();
		if (ig.input.mouseGuiActive)
		{
			item = null;
			if (this.lastmousefocus && this.lastmousefocus.focus)
				item = this.lastmousefocus;
			//faveButtonPressed = ig.input.pressed("guard");
		}
		if (this.isVisible() && (this.buttongroup.isActive() && !ig.interact.isBlocked()) && item != null && faveButtonPressed)
		{
			if (item != null)
			{
				if (!sc.model.player.itemFavs.includes(item.data.id))
				{ //add favorite
					if(sc.model.player.canAddFavorite())
					{
						sc.model.player.updateFavorite(item.data.id);
						sc.BUTTON_SOUND.submit.play();
						this.addFavoriteOverlay(item);
					}
					else
					{
						sc.BUTTON_SOUND.denied.play();					
					}
				}
				else
				{ //remove favorite
					sc.model.player.updateFavorite(item.data.id);
					item.removeChildGuiByIndex(item.hook.children.length - 1);
					sc.BUTTON_SOUND.submit.play();
				}
			}
		}
		else
			this.parent();
	}
});

//quicker scrolling to menus when you hold the button
ig.PressRepeater.inject({
	init(b, a){
		this.parent(b, a);
		this.repeatDelay *= 0.75;
	}
});


//add melee/range resistances to quick info box
sc.QUICK_INFO_BOXES.Enemy.inject({
	init()
	{
		this.parent();
		this.meleeranged = new sc.EnemyMeleeRanged;
		this.addChildGui(this.meleeranged);
	},
	setData(b, e)
	{
		this.parent(b, e);
		var resistances = [1, 1];
		var ball = e.params.ballFactor;
		if (ball < 1)
		{
			//resistances = [1, ball]; //true value
			resistances = [1.2, ball + 0.2]; //slightly fudged value so it shows up as a melee weakness instead of only a ranged resistance
		}
		else if (ball > 1) //this case doesn't actually show up in the normal game, nothing's specifically weak to ball...
		{
			//resistances = [1 / ball, 1]; //true value
			resistances = [1 / ball + 0.2, 1.2]; //slightly fudged value so it shows up as a ranged weakness instead of only a melee resistance
		}
		else
		{
			resistances = [1, 1];
		}
		resistances[1] += e.params.statusStates[3].getValue(e.params); //account for Mark status
		if (resistances[0] > 1.99) resistances[0] = 1.99;
		if (resistances[1] > 1.99) resistances[1] = 1.99;
		
		this.meleeranged.setStats(resistances, true);
	}
});
sc.EnemyMeleeRanged = ig.GuiElementBase.extend({
	gfx: new ig.Image("media/gui/meleerangedresist.png"),
	transitions: {
		DEFAULT: {
			state: {},
			time: 0.2,
			timeFunction: KEY_SPLINES.LINEAR
		},
		TRANS: {
			state: {
				alpha: 0.72
			},
			time: 0.2,
			timeFunction: KEY_SPLINES.LINEAR
		},
		VERYTRANS: {
			state: {
				alpha: 0.5
			},
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
	},
	res: [],
	lines: [],
	images: [],
	init: function () {
		this.parent();
		this.setSize(127, 140);
		for (var a = 0; a < 2; a++) {
			this.createNumber(a);
			this.createImage(a);
		}
	},
	setStats: function (a, b) {
		if (sc.options.get("enter-map-names"))
			this.doStateTransition("DEFAULT", true);
		else
			this.doStateTransition("HIDDEN", true);

		if (a)
			for (var i = 0; i < 2; i++) {
				var g = this.getValue(a[i]);
				this.res[i].setNumber(g, b);
				this.images[i].offsetY = i * 10;
				if (a[0] == 1 && a[1] == 1) //both zero
				{
					this.res[i].setColor(sc.GUI_NUMBER_COLOR.WHITE);
					this.res[i].doStateTransition("VERYTRANS", b);
					this.images[i].doStateTransition("VERYTRANS", b);
				}
				else if (g == 0)
				{
					this.res[i].setColor(sc.GUI_NUMBER_COLOR.WHITE);
					this.res[i].doStateTransition("TRANS", b);
					this.images[i].doStateTransition("TRANS", b);
				}
				else if (g < 0)
				{
					this.res[i].setColor(sc.GUI_NUMBER_COLOR.RED);
					this.images[i].offsetY += 20; //make it red too
					this.res[i].doStateTransition("DEFAULT", b);
					this.images[i].doStateTransition("DEFAULT", b);
				}
				else
				{
					this.res[i].setColor(sc.GUI_NUMBER_COLOR.WHITE);
					this.res[i].doStateTransition("DEFAULT", b);
					this.images[i].doStateTransition("DEFAULT", b);
				}
			}
	},
	hide: function () {
		this.doStateTransition("HIDDEN", true)
	},
	createNumber: function (a) {
		var b = new sc.NumberGui(999, {
			signed: true,
			transitionTime: 0.15,
			size: sc.NUMBER_SIZE.TINY,
		});
		b.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_BOTTOM);
		b.setPos(11, 6 + (1 - a) * 10);
		b.hook.transitions = this.transitions;
		this.addChildGui(b);
		this.res[a] = b
	},
	createImage: function (a) {
		var y = a * 16;
		var img = new ig.ImageGui(this.gfx, 0, 0, 34, 10);
		img.setAlign(ig.GUI_ALIGN_X.RIGHT, ig.GUI_ALIGN_Y.BOTTOM);
		img.setPos(5, 4 + (1 - a) * 10);
		img.hook.transitions = this.transitions;
		
		this.addChildGui(img);
		this.images[a] = img;
	},
	getValue: function (a) {
		return Math.round((a - 1) * -100)
	},
});

//add analog control to quick menu analysis
sc.QuickMenuAnalysis.inject({
	update()
	{
		if (this.isVisible() && this.buttonGroup.isActive() && !ig.interact.isBlocked() && ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD
			&& sc.options.get("analog-menus"))
		{
			var oldx = sc.quickmodel.cursor.x;
			var oldy = sc.quickmodel.cursor.y;
			
			this.parent();
			
			var stickx = sc.control.getAxesValue(ig.AXES.LEFT_STICK_X);
			var sticky = sc.control.getAxesValue(ig.AXES.LEFT_STICK_Y);
			
			if (!this.acceltime)
				this.acceltime = 0;
			
			if (Math.abs(stickx) > 0.1 || Math.abs(sticky) > 0.1)
			{
				var spd = (200 + this.acceltime * 100) * ig.system.actualTick;
				this.acceltime += 1 / 60;
				if (this.acceltime > 1) this.acceltime = 1;
				
				sc.quickmodel.cursor.x = oldx + stickx * spd;
				sc.quickmodel.cursor.y = oldy + sticky * spd;
				sc.quickmodel.cursorMoved = true;
				this.limitCursorPos();
				this.cursor.moveTo(sc.quickmodel.cursor.x, sc.quickmodel.cursor.y);
			}
			else
				this.acceltime = 0;
		}
		else
			this.parent();
	}
});
//add analog control to map screen
sc.MapAreaContainer.inject({
	update()
	{
		if (!sc.menu.mapLoading && !ig.interact.isBlocked() && this.buttongroup.isActive() && !sc.menu.mapStampMenu && ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD
			&& sc.options.get("analog-menus"))
		{
			var oldx = sc.menu.mapCursor.x;
			var oldy = sc.menu.mapCursor.y;
			
			this.parent();
			
			var stickx = sc.control.getAxesValue(ig.AXES.LEFT_STICK_X);
			var sticky = sc.control.getAxesValue(ig.AXES.LEFT_STICK_Y);
			
			if (!this.acceltime)
				this.acceltime = 0;
			
			if (Math.abs(stickx) > 0.1 || Math.abs(sticky) > 0.1)
			{
				var spd = (200 + this.acceltime * 100) * ig.system.actualTick;
				this.acceltime += 1 / 60;
				if (this.acceltime > 1) this.acceltime = 1;

				sc.menu.mapCursor.x = Math.round(oldx + stickx * spd);
				sc.menu.mapCursor.y = Math.round(oldy + sticky * spd);
				sc.menu.mapCursorMoved = true;
				this.limitCursorPos();
				this.findMap(sc.menu.mapCursor.x, sc.menu.mapCursor.y, true);
				this.cursor.moveTo(sc.menu.mapCursor.x, sc.menu.mapCursor.y);
				sc.menu.mapCamera.x = Math.floor(-sc.menu.mapCursor.x + ig.system.width / 2);
				sc.menu.mapCamera.y = Math.floor(-sc.menu.mapCursor.y + ig.system.height / 2);
				this.limitCameraPos();

				this.hook.scroll.x = sc.menu.mapCamera.x;
				this.hook.scroll.y = sc.menu.mapCamera.y;
			}
			else
				this.acceltime = 0;
		}
		else
			this.parent();
	}	
});
//add analog control to world map
sc.MapWorldMap.inject({
	update()
	{
		if (!ig.interact.isBlocked() && this.buttonGroup.isActive() && ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD
		 && sc.options.get("analog-menus"))
		{
			var oldx = sc.menu.mapWorldCursor.x;
			var oldy = sc.menu.mapWorldCursor.y;
			
			this.parent();
			
			var stickx = sc.control.getAxesValue(ig.AXES.LEFT_STICK_X);
			var sticky = sc.control.getAxesValue(ig.AXES.LEFT_STICK_Y);
			
			if (!this.acceltime)
				this.acceltime = 0;
			
			if (Math.abs(stickx) > 0.1 || Math.abs(sticky) > 0.1)
			{
				var spd = (150 + this.acceltime * 50) * ig.system.actualTick;
				this.acceltime += 1 / 60;
				if (this.acceltime > 1) this.acceltime = 1;

				sc.menu.mapWorldCursor.x = oldx + stickx * spd;
				sc.menu.mapWorldCursor.y = oldy + sticky * spd;
				sc.menu.mapWmCursorMoved = true;
				this._limitCursorPos();
				this.cursor.moveTo(sc.menu.mapWorldCursor.x, sc.menu.mapWorldCursor.y);
			}
			else
				this.acceltime = 0;
		}
		else
			this.parent();
	}	
});

//add analog control to circuit menu
sc.CircuitTreeDetailContainer.inject({
	update()
	{
		if (!ig.interact.isBlocked() && !(sc.menu.skillState == sc.MENU_SKILL_STATE.NODE_MENU || sc.menu.skillState == sc.MENU_SKILL_STATE.OVERVIEW || sc.menu.currentSkillTree >= 0 && !this.trees[sc.menu.currentSkillTree].buttonGroup.isActive())
			&& ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD && sc.options.get("analog-menus"))
		{
			var oldx = sc.menu.skillCursor.x;
			var oldy = sc.menu.skillCursor.y;
			
			this.parent();
			
			var stickx = sc.control.getAxesValue(ig.AXES.LEFT_STICK_X);
			var sticky = sc.control.getAxesValue(ig.AXES.LEFT_STICK_Y);
			
			if (!this.acceltime)
				this.acceltime = 0;
			
			if (Math.abs(stickx) > 0.1 || Math.abs(sticky) > 0.1)
			{
				var spd = (280 + this.acceltime * 100) * ig.system.actualTick;
				this.acceltime += 1 / 60;
				if (this.acceltime > 1) this.acceltime = 1;

				sc.menu.skillCursorMoved = true;
				sc.menu.skillCursor.x = Math.round(oldx + stickx * spd);
				sc.menu.skillCursor.y = Math.round(oldy + sticky * spd);
				this.limitCursorPos(sc.menu.currentSkillTree);
				this.cursor.moveTo(sc.menu.skillCursor.x, sc.menu.skillCursor.y);
				sc.menu.skillCamera.x = Math.floor(-sc.menu.skillCursor.x + ig.system.width / 2);
				sc.menu.skillCamera.y = Math.floor(-sc.menu.skillCursor.y + ig.system.height / 2);
				this.limitCameraPos(sc.menu.currentSkillTree);
				
				this.hook.scroll.x = sc.menu.skillCamera.x;
				this.hook.scroll.y = sc.menu.skillCamera.y;
			}
			else
				this.acceltime = 0;
		}
		else
			this.parent();
	}		
});
sc.CircuitTreeDetail.Node.inject({
	getDistanceToCursor()
	{
		return this.parent() * 0.7; //snap from further away because movement is slightly faster now
	}
});

//make combat arts more obvious on the skill tree
sc.CircuitTreeDetail.Node.inject({
	init(...args)
	{
		this.parent(...args);
		this.azuregfx = new ig.Image("media/gui/azurecircuit.png");
		
		var skillType = sc.skilltree.getSkill(this.skill.uid).skillType;
		this.isSkillNode = skillType != null;
	},
	updateDrawables(b)
	{
		if (this.isSkillNode && false) //it all worked, and i think if the base game did it i would've liked it, but it's weird as a mod...
		{
			var c = sc.model.player.hasSkill(this.skill.uid);
			b.addGfx(this.azuregfx,
				this.centerPos, this.centerPos, 0, c ? 32 + this.element * 32 : 0, 31, 31);
		}
		this.parent(b);
	}
});

//scroll menus when the cursor is *near* the edge of it instead of pressed right up against it, so you can actually see what's coming up
sc.ButtonListBox.inject({
	onSelectionChange()
	{
		var distfromedges = 40;
		
		var b = this.buttonGroup.getCurrentY();
		if (ig.input.mouseGuiActive)
			this._prevIndex = -1;
		else {
			var a = this._prevIndex;
			if (a < b) {
				var a = this.getHeightAtIndex(b),
				d = this.box.hook.size.y + this.box.hook.scroll.y * -1,
				d = Math.max(a - d + distfromedges, 0);
				if (d > 0)
					this.scrollY(d, this._skipFirst);
				else {
					d = this.box.hook.scroll.y * -1;
					if (a <= d) {
						a = this.getHeightAtIndex(b - 1) - this.paddingTop;
						this.scrollY( - (d - a), this._skipFirst)
					}
				}
			} else if (a > b) {
				a = this.getHeightAtIndex(b - 1) - this.paddingTop;
				d = this.box.hook.scroll.y * -1;
				d = Math.max(d - a + distfromedges, 0);
				if (d > 0)
					this.scrollY(-d, this._skipFirst);
				else {
					d = this.box.hook.size.y + this.box.hook.scroll.y * -1;
					a = this.getHeightAtIndex(b);
					d <= a && this.scrollY(a - d, this._skipFirst)
				}
			}
			this._skipFirst = false;
			this._prevIndex = b
		}
		this.parent();
	}
});

//move the Ku'lero landmark teleport point to the actual landmark
ig.Game.inject({
	loadLevel(b, a, d)
	{
		this.parent(b, a, d);
		if (ig.vars.currentLevelName == "finalDng/g/outdoor-02Center" && this.teleporting.position && this.teleporting.position.marker == "landmark")
		{
			this.playerEntity.coll.level = 1;
			this.playerEntity.coll.baseZPos = 1;
			this.playerEntity.coll.pos.x = 953;
			this.playerEntity.coll.pos.y = 1224;
			this.playerEntity.coll.pos.z = 1;
			this.playerEntity.face.x = 0;
			this.playerEntity.face.y = 1;
		}
	}
});


//r-stick scrolling on menus
sc.ButtonGroup.inject({
	doButtonTraversal(b)
	{
		if (!ig.input.mouseGuiActive && false)
		{
			var loopbuttonsbackup = this.loopButtons;
			this.loopButtons = false;
			if (this.rstickScrollDelay){
				this.rstickScrollDelay -= ig.system.tick;
				if (this.rstickScrollDelay <= 0)
					this.rstickScrollDelay = null;
			}
			if (!this.rstickScrollDelay && ig.gamepad.getAxesValue(ig.AXES.RIGHT_STICK_Y) > 0.8)
			{
				this.stepDown();
				this.rstickScrollDelay = 0.04;
			}
			if (!this.rstickScrollDelay && ig.gamepad.getAxesValue(ig.AXES.RIGHT_STICK_Y) < -0.8)
			{
				this.stepUp();
				this.rstickScrollDelay = 0.04;
			}
			this.loopButtons = loopbuttonsbackup;
		}
		this.parent(b);
	}
});
sc.ButtonListBox.inject({
	update()
	{
		if (!ig.input.mouseGuiActive && this.buttonGroup.noRStick == null)
		{
			var loopbuttonsbackup = this.buttonGroup.loopButtons;
			this.buttonGroup.loopButtons = false;
			if (this.rstickScrollDelay){
				this.rstickScrollDelay -= ig.system.tick;
				if (this.rstickScrollDelay <= 0)
					this.rstickScrollDelay = null;
			}
			if (!this.rstickScrollDelay && ig.gamepad.getAxesValue(ig.AXES.RIGHT_STICK_Y) > 0.8
				&& !(this.maxRowOverride != null && this.buttonGroup.current.x == this.maxRowOverride))
			{
				this.buttonGroup.stepDown();
				this.rstickScrollDelay = 0.04;
			}
			if (!this.rstickScrollDelay && ig.gamepad.getAxesValue(ig.AXES.RIGHT_STICK_Y) < -0.8
				&& !(this.minRowOverride != null && this.buttonGroup.current.x == this.minRowOverride))
			{
				this.buttonGroup.stepUp();
				this.rstickScrollDelay = 0.04;
			}
			this.buttonGroup.loopButtons = loopbuttonsbackup;
		}
		this.parent();
	}
});
sc.OptionsTabBox.inject({
	_createOptionList(b){
		this.parent(b);
		for (var i=0; i<this.rows.length; i++)
		{
			if (this.rows[i].option) //if an actual option, not the text box in the assists tab
			{
				if (this.list.minRowOverride == null)
					this.list.minRowOverride = this.rows[i].row;
				this.list.maxRowOverride = this.rows[i].row;
			}
		}
	}
});
sc.LoreListBoxNew.inject({
	onContentCreation(...args)
	{
		var ret = this.parent(...args);
		this.currentGroup.noRStick = true;
		return ret;
	}
});