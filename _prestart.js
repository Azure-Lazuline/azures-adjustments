window.azuretweaks={};

//text replacements
window.azuretweaks.textReplace=function(message)
{
	//"Al" and "AI" both being used frequently bugged the heck out of me when the font makes them exactly identical
	message = message.replace("Al ", "Albert ");
	message = message.replace("Al.", "Albert.");
	message = message.replace("Al,", "Albert,");
	message = message.replace("Al!", "Albert!");
	message = message.replace("Al?", "Albert?");

	//other stuff
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
ig.ENTITY.Player.inject({
  update(...args) {
	  if(ig.ENTITY.Player.notextskiptime){
		  ig.ENTITY.Player.notextskiptime -= 1 * ig.system.tick;
		  if(ig.ENTITY.Player.notextskiptime < 0) ig.ENTITY.Player.notextskiptime = null;
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

//make traders unlock in the trader book from just passing by the NPC (so the list pops up) instead of needing to actually interact,
//i've seen a lot of people assume this is how it works anyway until they get messed up by it later
sc.TradeInfo.inject({
	init(b, a){
		this.parent(b, a);
		this.iconGui.parentInfo = this;
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
		for (var i in this.allModifiersBackup){
			if ((item && item.properties.hasOwnProperty(i)) || (e && e.properties.hasOwnProperty(i)))
			{ //if the property exists in the new item, or on the old item that's replacing, add it to the list
				this.allModifiers[i] = this.allModifiersBackup[i];
			}
		}
		//then add the rest
		for (var i in this.allModifiersBackup){
			if (!this.allModifiers[i])
			{
				this.allModifiers[i] = this.allModifiersBackup[i];
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
			this.allModifiers = {};
			for (var i in this.allModifiersBackup){
				this.allModifiers[i] = this.allModifiersBackup[i];
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

//force scaling in Arena cups. El's Tweaks has similar functionality, implemented in a different way - i just wanted something basic.
//this gets disabled if El's Tweaks is active though since that one has a UI to toggle it, and some bugfixes i think.
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
		
		if(!this.checkedMap)
		{
			var mapname = ig.vars.currentLevelName;
			this.checkedMap = true;
			this.isInDungeon = false;
			if (mapname.startsWith("coldDng") || mapname.startsWith("heatDng") || mapname.startsWith("shockDng")
				|| mapname.startsWith("waveDng") || mapname.startsWith("finalDng")) this.isInDungeon = true;
			//console.warn(mapname);
			//console.warn(this.isInDungeon ? "dungeon" : "not dungeon");
		}
		if (this.isInDungeon && this.respawnTimer > 30) //30 seconds max respawn (instead of 3 minutes)
			this.respawnTimer = 30;
	}
});

//thing to help me debug enemies better
sc.EnemyType.inject({
	switchState(b, c){
		//console.warn("state: " + c);
		this.parent(b, c);
	}
});

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