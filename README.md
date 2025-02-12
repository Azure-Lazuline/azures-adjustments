# Azure's Balancing & Extras

![](https://github.com/Azure-Lazuline/azures-adjustments/blob/main/screenshots/banner.png?raw=true)

A bunch of small balance changes and bugfixes for CrossCode, intended to smooth things out just a little bit. A few combat arts had their visuals improved, or their stats adjusted — just giving some weaker skills some help, and making the most powerful skills a little bit more conditional. (But keeping their best-case just as strong as it used to be!) Some enemies have visuals that better indicate their attacks now too, and there's some other miscellaneous things like traders giving you more info on where the component items are, and some fixes for the Arena.

This was designed for a first playthrough in mind, but has nice additions for experienced players too. Most changes can be toggled in the options menu.

## Detailed Changes

<details>
<summary><b>Enemies/Bosses</b></summary>

- Added timing rings to hedgehags and behesloths so you know exactly when they'll dash. Go for the perfect guard!
  
- Made many attack tells much easier to see, like the X's on the ground from the mining robots, and the flash before ectovolts go for their melee attack.

- Bovines can be stunned with repeated melee attacks from behind.

- Fixed the erroneously swapped heat/cold weaknesses on the mecha fish enemies and boss.

- Dungeon enemies respawn much quicker after clearing the room, to help with getting materials from ones that are only in a single room.

- Hillkat Bandleader consistently calls for reinforcements at the intended HP thresholds, instead of also accidentally relying on RNG. (This helps arena scores not be luck-dependent.)

- King Kaktorro's flamethrower fires in pulses instead of a constant stream, giving you better opportunities to escape.

- The DLC temple midboss's phase transition attacks are in a randomized order but they're slightly easier to dodge, so it's not just a matter of memorizing where to place them.

- A certain DLC bonus boss spends *significantly* less time flying around doing nothing, and has generally improved AI with much more attack variety.
</details>
<details>
<summary><b>Combat Arts</b></summary>

- First Cut / Final Showdown: VFX improvements, and you're not stuck in place for as long if you whiff.

- Azure Surge: VFX improvements for quite a bit more punch.

- Ball of Boomerang: It hits multiple times, and deals more damage overall.

- Ashen Mine / Mine Valley: Small damage boost, to match their difficulty and lack of iframes compared to the alternative skills.

- Ring of Fire (all 3): VFX improvements to all of them, and a damage boost to base Ring of Fire itself.

- Hail Storm: Wider spread but better homing, to make it somewhat more reliable but still situational.

- Brisk Barrier / Icy Bastion: Icicles have more stopping force (the same as a charged ball).

- Frigid Flawke: Only does the camera pan if you actually hit an enemy, to prevent jarring camera movements.

- Tesla Twist / Tesla Waltz: Small damage boost, and a little easier to control.

- Thunder Dart / Storm Walker: Slows down time during the dash, so enemies are less likely to escape it before it goes off.

- Guarding Gale / Poltergeist: Stronger push force.

- Wave Decoy / Toxic Revenant: The decoy uses the guard animation instead of being motionless.

- Ether Snipe: Lower damage at first, but ramps back up to its old extremely high power level as it bounces more. You gotta go for the bank shots!

- Guard Sphere: SP gain greatly reduced while it's active, so it's still powerful when used sparingly but you can't keep it up permanently.

- Clock Block / Glitch Time: SP gain moderately reduced while it's active, keeping its extreme utility and combo potential but making it not literally pay for itself anymore.

- Most flying enemies no longer follow you into the air during jumping arts like Flare Burn, inadvertently dodging your attacks. (Parrots still do though since they're jerks and it forced a more interesting approach.)

- A few other small VFX improvements for various arts, and added sound effects to ones that were missing them.
</details>
<details>
<summary><b>UI</b></summary>

- Traders show item locations directly in the trade interface, instead of only in the pause menu.

- The equipment comparison menu always puts changed modifiers at the top of the list, so you don't need to expand it each time.

- You can now add/remove favorite consumables directly from the quick menu, instead of only the pause menu.

- Added the location name in the corner of the screen when you enter a new area.

- Added additional map stamps, to let you mark more chest types and the four elements.

- Added analog control to menus like the skilltree and map screen, when you're using a controller.

- On controller, the right stick will scroll quickly through most list menus (inventory, consumables, etc).

- Added an option to swap between *all* quests on the sidebar instead of just ones marked as a favorite.

- Traders get added to the trader book from just passing by them rather than needing to talk to them.

</details>
<details>
<summary><b>Other</b></summary>

- Ascended gear always scales to the arena cup's level, so arena cups from the base game don't get trampled by having gear from the DLC.

- Changed the arena end screen to show the base damage that you took, instead of just the resulting score.

- Added all missing arena cup banner images.

- Fixed the music triggers in Vermillion Cup rush mode.

- The sandbag (Baggy-kun) at the First Scholars HQ gives SP when hit. What kind of guild has a non-functional training dummy?

- Pets are automatically hidden during emotional or important scenes.

- A few small typo fixes and miscellaneous bugfixes.
</details>

---

### Installation

To use, install [ccloader](https://github.com/CCDirectLink/CCLoader), and go to the "Mods" menu ingame (the button at the *top* of the Options menu, not the tab on the right) and it should be listed there to select and install. It should automatically grab any prerequisites.

You can also install manually by placing [the .ccmod file](https://github.com/Azure-Lazuline/azures-adjustments/releases) in your ccloader mods folder, and doing the same with [extension-asset-preloader](https://github.com/elluminance/crosscode-extension-asset-preloader/releases) (a prerequisite needed to modify DLC enemies).
