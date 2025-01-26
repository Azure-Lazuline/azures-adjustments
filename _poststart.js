//toggle to make all quests appear on the sidebar instead of just favorited ones
sc.QuestModel.inject({
	cycleFavQuest(a, b)
	{
		if(sc.options.get("all-quest-type") == 0)
		{
			if (typeof this.markedQuests === 'string' || this.markedQuests instanceof String) //sometimes if it's one entry then it's stored as a string instead of array
				this.markedQuests = [this.markedQuests];
			
			var oldmarked = this.markedQuests;
			this.markedQuests = [];
			for (var d = this.activeQuests.length; d--; )
			{
				if(this.activeQuests[d].quest.id == "botanics" && !oldmarked.includes("botanics"))
				{ //don't include Crocus Pocus in "all quests" unless you've favorited it, since it's not something you actively do
					
				}
				else
				{
					this.markedQuests.push(this.activeQuests[d].quest.id);
				}
			}
			this.parent(a, b);
			this.markedQuests = oldmarked;
		}
		else
			this.parent(a, b);
	}
});
