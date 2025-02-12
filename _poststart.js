//toggle to make all quests appear on the sidebar instead of just favorited ones
sc.QuestModel.inject({
	getAdjustedMarkedQuests(oldmarked)
	{
		var ret = [];
		for (var d = this.activeQuests.length; d--; )
		{
			var task = this.activeQuests[d].currentTask;
			if(this.activeQuests[d].quest.id == "botanics" && (task == 0 || task == 2 || task == 4 || task == 6)
				&& !oldmarked.includes("botanics"))
			{ //don't include Crocus Pocus in "all quests" during the gathering parts unless you've favorited it, since it's not something you actively do

			}
			else
			{
				ret.push(this.activeQuests[d].quest.id);
			}
		}	
		return ret;
	},
	cycleFavQuest(a, b)
	{
		if(sc.options.get("all-quest-type") == 0)
		{
			if (typeof this.markedQuests === 'string' || this.markedQuests instanceof String) //sometimes if it's one entry then it's stored as a string instead of array
				this.markedQuests = [this.markedQuests];
			
			var oldmarked = this.markedQuests;
			this.markedQuests = this.getAdjustedMarkedQuests(oldmarked);
			
			var hasElTweaks = false;
			for (var c=0;c<window.activeMods.length;c++)
			{
				if (window.activeMods[c].name == "el-tweaks"
				|| window.activeMods[c].name == "trade-tracking")
					hasElTweaks = true;
			}
			if (hasElTweaks && a < 0 && this.markedQuests.length > 0 && this.focusQuest == -1 && sc.trade.favoriteTraders.length == 0)
			{ //el's tweaks is bugged if you have favorite quests but not favorite traders.
			  //This overly-specific case is fixing that manually instead of calling this.parent which would pass control to el's tweaks and screw it up
				var d = this.focusQuest;
				this.focusQuest = this.markedQuests.length - 1;
				if (this.focusQuest != -1 && this.isMarkedQuestDone()) {
					this.markedQuests.splice(this.focusQuest, 1);
					this.cycleFavQuest(a, b)
				} else
					b || sc.Model.notifyObserver(this, sc.QUEST_MODEL_EVENT.FAV_QUEST_CHANGED, d)
			}
			else
			{
				this.parent(a, b);
			}
			
			this.markedQuests = oldmarked;
		}
		else
			this.parent(a, b);
	},
	getMarkedQuest()
	{
		if(sc.options.get("all-quest-type") == 0)
		{
			var oldmarked = this.markedQuests;
			this.markedQuests = this.getAdjustedMarkedQuests(oldmarked);
			var ret = this.parent();
			this.markedQuests = oldmarked;
			return ret;
		}
		else
			return this.parent();
	},
	getCurrentMarkedQuestTaskIndex()
	{
		if(sc.options.get("all-quest-type") == 0)
		{
			var oldmarked = this.markedQuests;
			this.markedQuests = this.getAdjustedMarkedQuests(oldmarked);
			var ret = this.parent();
			this.markedQuests = oldmarked;
			return ret;
		}
		else
			return this.parent();
	},
	isMarkedQuestDone()
	{
		if(sc.options.get("all-quest-type") == 0)
		{
			var oldmarked = this.markedQuests;
			this.markedQuests = this.getAdjustedMarkedQuests(oldmarked);
			var ret = this.parent();
			this.markedQuests = oldmarked;
			return ret;
		}
		else
			return this.parent();
	}
});
