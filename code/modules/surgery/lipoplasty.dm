/datum/surgery/lipoplasty
	name = "Липопластика"
	steps = list(/datum/surgery_step/incise, /datum/surgery_step/clamp_bleeders, /datum/surgery_step/cut_fat, /datum/surgery_step/remove_fat, /datum/surgery_step/close)
	possible_locs = list(BODY_ZONE_CHEST)

/datum/surgery/lipoplasty/can_start(mob/user, mob/living/carbon/target)
	if(HAS_TRAIT(target, TRAIT_FAT) && target.nutrition >= NUTRITION_LEVEL_WELL_FED)
		return 1
	return 0


//cut fat
/datum/surgery_step/cut_fat
	name = "отрезать лишний жир"
	implements = list(TOOL_SAW = 100, /obj/item/hatchet = 35, /obj/item/kitchen/knife/butcher = 25)
	time = 64

/datum/surgery_step/cut_fat/preop(mob/user, mob/living/carbon/target, target_zone, obj/item/tool, datum/surgery/surgery)
	user.visible_message(span_notice("[user] начинает отрезать лишний жир у [sklonenie(target.name, RODITELNI, target.gender)].") , span_notice("Вы начинаете отрезать лишний жир у [sklonenie(target.name, RODITELNI, target.gender)]..."))
	display_results(user, target, span_notice("Вы начинаете отрезать лишний жир у [sklonenie(target.name, RODITELNI, target.gender)]...") ,
			span_notice("[user] начинает отрезать лишний жир у [sklonenie(target.name, RODITELNI, target.gender)].") ,
			span_notice("[user] начинает отрезать лишний жир в [target_zone] у [sklonenie(target.name, RODITELNI, target.gender)] при помощи [tool]."))

/datum/surgery_step/cut_fat/success(mob/user, mob/living/carbon/target, target_zone, obj/item/tool, datum/surgery/surgery, default_display_results)
	display_results(user, target, span_notice("Вы отрезали лишний жир у [sklonenie(target.name, RODITELNI, target.gender)].") ,
			span_notice("[user] отрезал лишний жир у [sklonenie(target.name, RODITELNI, target.gender)]!") ,
			span_notice("[user] отрезал лишний жир у [sklonenie(target.name, RODITELNI, target.gender)]."))
	return 1

//remove fat
/datum/surgery_step/remove_fat
	name = "извлеките лишний жир"
	implements = list(TOOL_RETRACTOR = 100, TOOL_SCREWDRIVER = 45, TOOL_WIRECUTTER = 35)
	time = 32

/datum/surgery_step/remove_fat/preop(mob/user, mob/living/carbon/target, target_zone, obj/item/tool, datum/surgery/surgery)
	display_results(user, target, span_notice("Вы начинаете извлекать лишний жир из [sklonenie(target.name, RODITELNI, target.gender)]...") ,
			span_notice("[user] начинает извлекать лишний жир из [sklonenie(target.name, RODITELNI, target.gender)]!") ,
			span_notice("[user] начинает извлекать лишний жир из [sklonenie(target.name, RODITELNI, target.gender)]."))

/datum/surgery_step/remove_fat/success(mob/user, mob/living/carbon/target, target_zone, obj/item/tool, datum/surgery/surgery, default_display_results = FALSE)
	display_results(user, target, span_notice("Вы извлекли лишний жир из [sklonenie(target.name, RODITELNI, target.gender)].") ,
			span_notice("[user] извлек лишний жир из [sklonenie(target.name, RODITELNI, target.gender)]!") ,
			span_notice("[user] извлек лишний жир из [sklonenie(target.name, RODITELNI, target.gender)]!"))
	target.overeatduration = 0 //patient is unfatted
	var/removednutriment = target.nutrition
	target.set_nutrition(NUTRITION_LEVEL_WELL_FED)
	removednutriment -= NUTRITION_LEVEL_WELL_FED //whatever was removed goes into the meat
	var/mob/living/carbon/human/H = target
	var/typeofmeat = /obj/item/food/meat/slab/human

	if(H.dna && H.dna.species)
		typeofmeat = H.dna.species.meat

	var/obj/item/food/meat/slab/human/newmeat = new typeofmeat
	newmeat.name = "жирное мясо"
	newmeat.desc = "Очень жирное мясо прямиком из разделочной."
	newmeat.subjectname = H.real_name
	newmeat.subjectjob = H.job
	newmeat.reagents.add_reagent (/datum/reagent/consumable/nutriment, (removednutriment / 15)) //To balance with nutriment_factor of nutriment
	newmeat.forceMove(target.loc)
	return ..()
