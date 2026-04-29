/*******************************************************************************
 * ê³µê°ê°ë°©ì íµí´ ë³ì­ëªë¬¸ê° ì°ëê¸°ê´ ì ë³´ë¥¼ í¸ì¶í¨
 ******************************************************************************/
var local_array_nm = ['ìì¸','ë¶ì°','ëêµ¬ê²½ë¶','ì¸ì²ê²½ê¸°','ê´ì£¼ì ë¨','ëì ì¶©ë¨','ê°ì','ì¶©ë¶','ì ë¶','ê²½ë¨','ì ì£¼','ê²½ê¸°ë¶ë¶','ê°ììë','ì êµ­'];
var local_array_cd = ['09','08' ,'06',   '10' ,  '05',   '07',   '02','14', '12','04','13', '03',   '01',  '11'];
// ì§ì­ë³ ë¦¬ì¤í¸ í¸ì¶í¨ì
function f_bymmgUDGiGwanJHList(){
	var url = "https://open.mma.go.kr/caisGGGS/bymmgListAjaxJsonCall.json";
	//var url = "http://gggbs.oma.go.kr/caisGGGS/bymmgListAjaxJsonCall.json";

	var textCont ='';
	var localName = '';
	url = url+"?"+"&callback=?";
	$.getJSON(url, function(d){
		if(d.success==true){

		for(var i=0;i<local_array_nm.length;i++){	
				var cnt = 0;
				textCont +='<table class="sp_list">';
				textCont +='<caption>'+local_array_nm[i]+'ì§ì­ ì§ìê¸°ê´</caption>';
				textCont +='<colgroup>';
	            textCont +='<col class="item1" />';
	            textCont +='<col class="item2" />';
	            textCont +='<col class="item3" />';
	            textCont +='</colgroup>';
	            textCont +='<thead>';
				textCont +='<tr>';
				textCont +='<th class="line">êµ¬ë¶</th>';
				textCont +='<th class="line">ë©´ì </th>';
				textCont +='<th>í ì¸</th>';
				textCont +='</tr>';
				textCont +='</thead>';
				textCont +='<tbody><tr>';
				textCont +='<td class="line">'+local_array_nm[i]+'ì§ì­ <br /></td>';
				textCont +='<td class="line">';
					for(var j=0; j<d.list.length; j++){
						if(d.list[j].udjiyeok_cd==local_array_cd[i]&&d.list[j].udae_gbcd=='01'){
								textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
								textCont +=d.list[j].udae_ggm;
								textCont +='</a><br/>';
								cnt++;
						}
					}
				cnt=0;
				textCont +='</td>';
				textCont +='<td>';
					for(var j=0; j<d.list.length; j++){
						if(d.list[j].udjiyeok_cd==local_array_cd[i]&&d.list[j].udae_gbcd=='02'){
								textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
								textCont +=d.list[j].udae_ggm;
								textCont +='</a><br/>';
								cnt++;
						}
					}
					textCont +='</td></tr></tbody></table><br class="hr" />';
			 }
		}else{
			alert("íµì ì´ ìííì§ ììµëë¤.\në¤ì ìëí´ ì£¼ì¸ì");
		}
		$("#areaList").html(textCont);
	});
}
// ìì¢ë³ ë¦¬ì¤í¸ í¸ì¶í¨ì
	function f_bymmgUDGiGwanJHPart(){
		var url = "https://open.mma.go.kr/caisGGGS/bymmgPartAjaxJsonCall.json";
		//var url = "http://gggbs.oma.go.kr/caisGGGS/bymmgPartAjaxJsonCall.json";
		var textCont ='';
		url = url+"?"+"&callback=?";
		$.getJSON(url, function(d){
			if(d.success==true){
				
				if(d.udgigwanGatSuVO.gungNungDutyFree!=0||d.udgigwanGatSuVO.gungNungDisCount!=0){
						textCont +='<table class="sp_list">';
						textCont +='<caption>ê¶ë¥ì/ì ì ì§ ì°ë ë¦¬ì¤í¸</caption>';
						textCont +='<colgroup>';
						textCont +='<col class="item1" />';
						textCont +='<col class="item2" />';
						textCont +='<col class="item3" />';
						textCont +='</colgroup>';
						textCont +='<thead>';
						textCont +='<tr>';
						textCont +='<th class="line">êµ¬ë¶</th>';
						textCont +='<th class="line">ë©´ì </th>';
						textCont +='<th>í ì¸</th>';
						textCont +='</tr>';
						textCont +='</thead>';
						textCont +='<tfoot><tr><td colspan="3"></td></tr></tfoot>';
						textCont +='<tbody><tr>';
						textCont +='<td class="line">ê¶ë¥ì/ì ì ì§<br /></td>';
						textCont +='<td class="line">';
						
						//ë©´ì  ìì­
						for(var i=0;i<local_array_nm.length;i++){	
							var cnt = 0;
							var local_id_val = "loc_nm_"+local_array_cd[i];
								textCont +='<p class="special_sub_area"><h2 id="'+local_id_val+'">'+local_array_nm[i]+'</h2></p>';
								for(var j=0; j<d.list.length; j++){
									if(d.list[j].udjiyeok_cd==local_array_cd[i]&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='03'){									
											textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
											textCont +=d.list[j].udae_ggm;
											textCont +='</a><br/>';
											cnt++;
									}
								}
								textCont +='<br/>';
						}
						
						cnt=0;
						textCont +='</td>';
						textCont +='<td class="line">';
						
						// í ì¸ ìì­
						for(var i=0;i<local_array_nm.length;i++){	
							var cnt = 0;
							textCont +='<p class="special_sub_area"><h2>'+local_array_nm[i]+'</h2> </p>';
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd==local_array_cd[i]&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='03'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
								
								}
							}
							textCont +='<br/>';
						}	
						textCont +='</td>';
						textCont +='</tr></tbody></table>';
					}

						if(d.udgigwanGatSuVO.MuseumDutyFree!=0||d.udgigwanGatSuVO.MuseumDisCount!=0){
							textCont +='<table class="sp_list">';
							textCont +='<caption>ê¸°ëê´/ë°ë¬¼ê´ ì°ë ë¦¬ì¤í¸</caption>';
							textCont +='<colgroup>';
							textCont +='<col class="item1" />';
							textCont +='<col class="item2" />';
							textCont +='<col class="item3" />';
							textCont +='</colgroup>';
							textCont +='<thead>';
							textCont +='<tr>';
							textCont +='<th class="line">êµ¬ë¶</th>';
							textCont +='<th class="line">ë©´ì </th>';
							textCont +='<th>í ì¸</th>';
							textCont +='</tr>';
							textCont +='</thead>';
							textCont +='<tfoot><tr><td colspan="3"></td></tr></tfoot>';
							textCont +='<tbody><tr>';
							textCont +='<td class="line">ê¸°ëê´/ë°ë¬¼ê´<br /></td>';
							textCont +='<td class="line">';
							if(d.udgigwanGatSuVO.seoulMuseumDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ìì¸</h2> </p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='09'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='04'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
								
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.busanMuseumDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ë¶ì° </h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='08'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='04'){
				
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.daeguMuseumDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ëêµ¬ê²½ë¶</h2> </p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='06'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='04'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
								
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.suwonMuseumDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ì¸ì²ê²½ê¸°</h2> </p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='10'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='04'){
								
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
								
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gwangjuMuseumDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ê´ì£¼ì ë¨</h2> </p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='05'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='04'){
								
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
								
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.daejeonMuseumDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ëì ì¶©ë¨</h2> </p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='07'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='04'){
								
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gangwonMuseumDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ê°ì</h2> </p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='02'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='04'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.chungbukMuseumDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ì¶©ë¶</h2> </p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='14'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='04'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.jeonbukMuseumDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ì ë¶</h2> </p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='12'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='04'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gyeongnamMuseumDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ê²½ë¨</h2> </p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='04'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='04'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
								
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.jejuMuseumDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ì ì£¼</h2> </p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='13'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='04'){
								
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gyeonggibukbuMuseumDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ê²½ê¸°ë¶ë¶</h2> </p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='03'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='04'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gangwonyoungdongMuseumDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ê°ììë</h2> </p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='01'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='04'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
								
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.nationWideMuseumDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ì êµ­</h2> </p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='11'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='04'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
								
								}
							}
							cnt=0;
							textCont +='</td>';
							textCont +='<td class="line">';
							if(d.udgigwanGatSuVO.seoulMuseumDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ìì¸ </h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='09'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='04'){
								
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.busanMuseumDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ë¶ì°</h2> </p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='08'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='04'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.daeguMuseumDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ëêµ¬ê²½ë¶</h2> </p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='06'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='04'){
								
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.suwonMuseumDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ì¸ì²ê²½ê¸° </h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='10'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='04'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gwangjuMuseumDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ê´ì£¼ì ë¨</h2> </p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='05'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='04'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.daejeonMuseumDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ëì ì¶©ë¨</h2> </p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='07'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='04'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gangwonMuseumDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ê°ì </h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='02'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='04'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.chungbukMuseumDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ì¶©ë¶</h2> </p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='14'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='04'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.jeonbukMuseumDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ì ë¶</h2> </p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='12'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='04'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gyeongnamMuseumDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ê²½ë¨ </h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='04'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='04'){
								
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.jejuMuseumDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ì ì£¼ </h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='13'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='04'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gyeonggibukbuMuseumDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ê²½ê¸°ë¶ë¶ </h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='03'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='04'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gangwonyoungdongMuseumDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ê°ììë</h2> </p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='01'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='04'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.nationWideMuseumDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ì êµ­</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='11'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='04'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							textCont +='</td>';
							textCont +='</tr></tbody></table>';
					}

					if(d.udgigwanGatSuVO.sportsDutyFree==0&&d.udgigwanGatSuVO.sportsDisCount==0){
						textCont +='<table class="sp_list">';
						textCont +='<tr><td>';
						textCont +='<a href="#n" target="_blank" title="ìì°½" ì¡°íë ë ì /ì¤í¬ì¸  ë¦¬ì¤í¸ê° ììµëë¤.';
						textCont +='</a><br/>';
						textCont +='</td></tr>';
						textCont +='</table>';
					}else{
						if(d.udgigwanGatSuVO.SportsDutyFree!=0||d.udgigwanGatSuVO.SportsDisCount!=0){
							textCont +='<table class="sp_list">';
							textCont +='<caption>ë ì /ì¤í¬ì¸  ì°ë ë¦¬ì¤í¸</caption>';
							textCont +='<colgroup>';
							textCont +='<col class="item1" />';
							textCont +='<col class="item2" />';
							textCont +='<col class="item3" />';
							textCont +='</colgroup>';
							textCont +='<thead>';
							textCont +='<tr>';
							textCont +='<th class="line">êµ¬ë¶</th>';
							textCont +='<th class="line">ë©´ì </th>';
							textCont +='<th>í ì¸</th>';
							textCont +='</tr>';
							textCont +='</thead>';
							textCont +='<tfoot><tr><td colspan="3"></td></tr></tfoot>';
							textCont +='<tbody><tr>';
							textCont +='<td class="line">ë ì /ì¤í¬ì¸ <br /></td>';
							textCont +='<td class="line">';
						if(d.udgigwanGatSuVO.seoulSportsDutyFree!=0){
							textCont +='<p class="special_sub_area"><h2>ìì¸ </h2></p>';
						}
						for(var j=0; j<d.list.length; j++){
							if(d.list[j].udjiyeok_cd=='09'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='09'){
								
									textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
									textCont +=d.list[j].udae_ggm;
									textCont +='</a><br/>';
									cnt++;
								
							}
						}
						cnt=0;
						if(d.udgigwanGatSuVO.busanSportsDutyFree!=0){
							textCont +='<p class="special_sub_area"><h2>ë¶ì°</h2> </p>';
						}
						for(var j=0; j<d.list.length; j++){
							if(d.list[j].udjiyeok_cd=='08'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='09'){
								
									textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
									textCont +=d.list[j].udae_ggm;
									textCont +='</a><br/>';
									cnt++;
							
							}
						}
						cnt=0;
						if(d.udgigwanGatSuVO.daeguSportsDutyFree!=0){
							textCont +='<p class="special_sub_area"><h2>ëêµ¬ê²½ë¶ </h2></p>';
						}
						for(var j=0; j<d.list.length; j++){
							if(d.list[j].udjiyeok_cd=='06'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='09'){
								
									textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
									textCont +=d.list[j].udae_ggm;
									textCont +='</a><br/>';
									cnt++;
							
							}
						}
						cnt=0;
						if(d.udgigwanGatSuVO.suwonSportsDutyFree!=0){
							textCont +='<p class="special_sub_area"><h2>ì¸ì²ê²½ê¸° </h2></p>';
						}
						for(var j=0; j<d.list.length; j++){
							if(d.list[j].udjiyeok_cd=='10'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='09'){
								
									textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
									textCont +=d.list[j].udae_ggm;
									textCont +='</a><br/>';
									cnt++;
								
							}
						}
						cnt=0;
						if(d.udgigwanGatSuVO.gwangjuSportsDutyFree!=0){
							textCont +='<p class="special_sub_area"><h2>ê´ì£¼ì ë¨</h2> </p>';
						}
						for(var j=0; j<d.list.length; j++){
							if(d.list[j].udjiyeok_cd=='05'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='09'){
								
									textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
									textCont +=d.list[j].udae_ggm;
									textCont +='</a><br/>';
									cnt++;
								
							}
						}
						cnt=0;
						if(d.udgigwanGatSuVO.daejeonSportsDutyFree!=0){
							textCont +='<p class="special_sub_area"><h2>ëì ì¶©ë¨</h2> </p>';
						}
						for(var j=0; j<d.list.length; j++){
							if(d.list[j].udjiyeok_cd=='07'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='09'){
							
									textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
									textCont +=d.list[j].udae_ggm;
									textCont +='</a><br/>';
									cnt++;
								
							}
						}
						cnt=0;
						if(d.udgigwanGatSuVO.gangwonSportsDutyFree!=0){
							textCont +='<p class="special_sub_area"><h2>ê°ì</h2></p>';
						}
						for(var j=0; j<d.list.length; j++){
							if(d.list[j].udjiyeok_cd=='02'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='09'){
								
									textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
									textCont +=d.list[j].udae_ggm;
									textCont +='</a><br/>';
									cnt++;
								
							}
						}
						cnt=0;
						if(d.udgigwanGatSuVO.chungbukSportsDutyFree!=0){
							textCont +='<p class="special_sub_area"><h2>ì¶©ë¶</h2> </p>';
						}
						for(var j=0; j<d.list.length; j++){
							if(d.list[j].udjiyeok_cd=='14'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='09'){
								
									textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
									textCont +=d.list[j].udae_ggm;
									textCont +='</a><br/>';
									cnt++;
								
							}
						}
						cnt=0;
						if(d.udgigwanGatSuVO.jeonbukSportsDutyFree!=0){
							textCont +='<p class="special_sub_area"><h2>ì ë¶</h2> </p>';
						}
						for(var j=0; j<d.list.length; j++){
							if(d.list[j].udjiyeok_cd=='12'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='09'){
								
									textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
									textCont +=d.list[j].udae_ggm;
									textCont +='</a><br/>';
									cnt++;
								
							}
						}
						cnt=0;
						if(d.udgigwanGatSuVO.gyeongnamSportsDutyFree!=0){
							textCont +='<p class="special_sub_area"><h2>ê²½ë¨</h2> </p>';
						}
						for(var j=0; j<d.list.length; j++){
							if(d.list[j].udjiyeok_cd=='04'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='09'){
								
									textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
									textCont +=d.list[j].udae_ggm;
									textCont +='</a><br/>';
									cnt++;
								
							}
						}
						cnt=0;
						if(d.udgigwanGatSuVO.jejuSportsDutyFree!=0){
							textCont +='<p class="special_sub_area"><h2>ì ì£¼ </h2></p>';
						}
						for(var j=0; j<d.list.length; j++){
							if(d.list[j].udjiyeok_cd=='13'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='09'){
								
									textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
									textCont +=d.list[j].udae_ggm;
									textCont +='</a><br/>';
									cnt++;
								
							}
						}
						cnt=0;
						if(d.udgigwanGatSuVO.gyeonggibukbuSportsDutyFree!=0){
							textCont +='<p class="special_sub_area"><h2>ê²½ê¸°ë¶ë¶</h2> </p>';
						}
						for(var j=0; j<d.list.length; j++){
							if(d.list[j].udjiyeok_cd=='03'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='09'){
								
									textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
									textCont +=d.list[j].udae_ggm;
									textCont +='</a><br/>';
									cnt++;
								
							}
						}
						cnt=0;
						if(d.udgigwanGatSuVO.gangwonyoungdongSportsDutyFree!=0){
							textCont +='<p class="special_sub_area"><h2>ê°ììë</h2> </p>';
						}
						for(var j=0; j<d.list.length; j++){
							if(d.list[j].udjiyeok_cd=='01'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='09'){
								
									textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
									textCont +=d.list[j].udae_ggm;
									textCont +='</a><br/>';
									cnt++;
							
							}
						}
						cnt=0;
						if(d.udgigwanGatSuVO.nationWideSportsDutyFree!=0){
							textCont +='<p class="special_sub_area"><h2>ì êµ­ </h2></p>';
						}
						for(var j=0; j<d.list.length; j++){
							if(d.list[j].udjiyeok_cd=='11'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='09'){
								
									textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
									textCont +=d.list[j].udae_ggm;
									textCont +='</a><br/>';
									cnt++;
								
							}
						}
						cnt=0;
						textCont +='</td>';
						textCont +='<td class="line">';
						if(d.udgigwanGatSuVO.seoulSportsDisCount!=0){
							textCont +='<p class="special_sub_area"><h2>ìì¸</h2></p>';
						}
						for(var j=0; j<d.list.length; j++){
							if(d.list[j].udjiyeok_cd=='09'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='09'){
							
									textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
									textCont +=d.list[j].udae_ggm;
									textCont +='</a><br/>';
									cnt++;
							
							}
						}
						cnt=0;
						if(d.udgigwanGatSuVO.busanSportsDisCount!=0){
							textCont +='<p class="special_sub_area"><h2>ë¶ì°</h2></p>';
						}
						for(var j=0; j<d.list.length; j++){
							if(d.list[j].udjiyeok_cd=='08'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='09'){
								
									textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
									textCont +=d.list[j].udae_ggm;
									textCont +='</a><br/>';
									cnt++;
								
							}
						}
						cnt=0;
						if(d.udgigwanGatSuVO.daeguSportsDisCount!=0){
							textCont +='<p class="special_sub_area"><h2>ëêµ¬ê²½ë¶</h2></p>';
						}
						for(var j=0; j<d.list.length; j++){
							if(d.list[j].udjiyeok_cd=='06'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='09'){
								
									textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
									textCont +=d.list[j].udae_ggm;
									textCont +='</a><br/>';
									cnt++;
							
							}
						}
						cnt=0;
						if(d.udgigwanGatSuVO.suwonSportsDisCount!=0){
							textCont +='<p class="special_sub_area"><h2>ì¸ì²ê²½ê¸°</h2></p>';
						}
						for(var j=0; j<d.list.length; j++){
							if(d.list[j].udjiyeok_cd=='10'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='09'){
								
									textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
									textCont +=d.list[j].udae_ggm;
									textCont +='</a><br/>';
									cnt++;
								
							}
						}
						cnt=0;
						if(d.udgigwanGatSuVO.gwangjuSportsDisCount!=0){
							textCont +='<p class="special_sub_area"><h2>ê´ì£¼ì ë¨</h2></p>';
						}
						for(var j=0; j<d.list.length; j++){
							if(d.list[j].udjiyeok_cd=='05'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='09'){
									textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
									textCont +=d.list[j].udae_ggm;
									textCont +='</a><br/>';
									cnt++;
								
							}
						}
						cnt=0;
						if(d.udgigwanGatSuVO.daejeonSportsDisCount!=0){
							textCont +='<p class="special_sub_area"><h2>ëì ì¶©ë¨</h2></p>';
						}
						for(var j=0; j<d.list.length; j++){
							if(d.list[j].udjiyeok_cd=='07'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='09'){
								
									textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
									textCont +=d.list[j].udae_ggm;
									textCont +='</a><br/>';
									cnt++;
							
							}
						}
						cnt=0;
						if(d.udgigwanGatSuVO.gangwonSportsDisCount!=0){
							textCont +='<p class="special_sub_area"><h2>ê°ì</h2></p>';
						}
						for(var j=0; j<d.list.length; j++){
							if(d.list[j].udjiyeok_cd=='02'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='09'){
								
									textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
									textCont +=d.list[j].udae_ggm;
									textCont +='</a><br/>';
									cnt++;
							
							}
						}
						cnt=0;
						if(d.udgigwanGatSuVO.chungbukSportsDisCount!=0){
							textCont +='<p class="special_sub_area"><h2>ì¶©ë¶</h2></p>';
						}
						for(var j=0; j<d.list.length; j++){
							if(d.list[j].udjiyeok_cd=='14'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='09'){
							
									textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
									textCont +=d.list[j].udae_ggm;
									textCont +='</a><br/>';
									cnt++;
								
							}
						}
						cnt=0;
						if(d.udgigwanGatSuVO.jeonbukSportsDisCount!=0){
							textCont +='<p class="special_sub_area"><h2>ì ë¶</h2></p>';
						}
						for(var j=0; j<d.list.length; j++){
							if(d.list[j].udjiyeok_cd=='12'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='09'){
								
									textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
									textCont +=d.list[j].udae_ggm;
									textCont +='</a><br/>';
									cnt++;
								
							}
						}
						cnt=0;
						if(d.udgigwanGatSuVO.gyeongnamSportsDisCount!=0){
							textCont +='<p class="special_sub_area"><h2>ê²½ë¨</h2></p>';
						}
						for(var j=0; j<d.list.length; j++){
							if(d.list[j].udjiyeok_cd=='04'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='09'){
								
									textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
									textCont +=d.list[j].udae_ggm;
									textCont +='</a><br/>';
									cnt++;
							
							}
						}
						cnt=0;
						if(d.udgigwanGatSuVO.jejuSportsDisCount!=0){
							textCont +='<p class="special_sub_area"><h2>ì ì£¼</h2></p>';
						}
						for(var j=0; j<d.list.length; j++){
							if(d.list[j].udjiyeok_cd=='13'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='09'){
								
									textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
									textCont +=d.list[j].udae_ggm;
									textCont +='</a><br/>';
									cnt++;
								
							}
						}
						cnt=0;
						if(d.udgigwanGatSuVO.gyeonggibukbuSportsDisCount!=0){
							textCont +='<p class="special_sub_area"><h2>ê²½ê¸°ë¶ë¶</h2></p>';
						}
						for(var j=0; j<d.list.length; j++){
							if(d.list[j].udjiyeok_cd=='03'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='09'){
								
									textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
									textCont +=d.list[j].udae_ggm;
									textCont +='</a><br/>';
									cnt++;
								
							}
						}
						cnt=0;
						if(d.udgigwanGatSuVO.gangwonyoungdongSportsDisCount!=0){
							textCont +='<p class="special_sub_area"><h2>ê°ììë</h2></p>';
						}
						for(var j=0; j<d.list.length; j++){
							if(d.list[j].udjiyeok_cd=='01'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='09'){
								
									textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
									textCont +=d.list[j].udae_ggm;
									textCont +='</a><br/>';
									cnt++;
								
							}
						}
						cnt=0;
						if(d.udgigwanGatSuVO.nationWideSportsDisCount!=0){
							textCont +='<p class="special_sub_area"><h2>ì êµ­</h2></p>';
						}
						for(var j=0; j<d.list.length; j++){
							if(d.list[j].udjiyeok_cd=='11'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='09'){
								
									textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
									textCont +=d.list[j].udae_ggm;
									textCont +='</a><br/>';
									cnt++;
								
							}
						}
						cnt=0;
						textCont +='</td>';
						textCont +='</tr></tbody></table>';
					}
					}
					if(d.udgigwanGatSuVO.moonWhaDutyFree==0&&d.udgigwanGatSuVO.moonWhaDisCount==0){
						textCont +='<table class="sp_list">';
						textCont +='<tr><td>';
						textCont +='<a href="#n" target="_blank" title="ìì°½" ì¡°íë ë¬¸í ë¦¬ì¤í¸ê° ììµëë¤.';
						textCont +='</a><br/>';
						textCont +='</td></tr>';
						textCont +='</table>';
					}else{
						if(d.udgigwanGatSuVO.moonWhaDutyFree!=0||d.udgigwanGatSuVO.moonWhaDisCount!=0){
							textCont +='<table class="sp_list">';
							textCont +='<caption>ë¬¸í ì°ë ë¦¬ì¤í¸</caption>';
							textCont +='<colgroup>';
							textCont +='<col class="item1" />';
							textCont +='<col class="item2" />';
							textCont +='<col class="item3" />';
							textCont +='</colgroup>';
							textCont +='<thead>';
							textCont +='<tr>';
							textCont +='<th class="line">êµ¬ë¶</th>';
							textCont +='<th class="line">ë©´ì </th>';
							textCont +='<th>í ì¸</th>';
							textCont +='</tr>';
							textCont +='</thead>';
							textCont +='<tfoot><tr><td colspan="3"></td></tr></tfoot>';
							textCont +='<tbody><tr>';
							textCont +='<td class="line">ë¬¸í<br /></td>';
							textCont +='<td class="line">';
							if(d.udgigwanGatSuVO.seoulMoonWhaDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ìì¸</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='09'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='06'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.busanMoonWhaDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ë¶ì°</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='08'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='06'){
								
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
								
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.daeguMoonWhaDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ëêµ¬ê²½ë¶</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='06'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='06'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.suwonMoonWhaDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ì¸ì²ê²½ê¸°</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='10'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='06'){
								
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
								
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gwangjuMoonWhaDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ê´ì£¼ì ë¨</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='05'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='06'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.daejeonMoonWhaDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ëì ì¶©ë¨</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='07'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='06'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gangwonMoonWhaDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ê°ì</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='02'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='06'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.chungbukMoonWhaDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ì¶©ë¶</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='14'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='06'){
								
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
								
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.jeonbukMoonWhaDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ì ë¶</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='12'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='06'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gyeongnamMoonWhaDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ê²½ë¨</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='04'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='06'){
								
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.jejuMoonWhaDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ì ì£¼</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='13'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='06'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gyeonggibukbuMoonWhaDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ê²½ê¸°ë¶ë¶</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='03'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='06'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gangwonyoungdongMoonWhaDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ê°ììë</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='01'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='06'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
								
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.nationWideMoonWhaDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ì êµ­</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='11'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='06'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							textCont +='</td>';
							textCont +='<td class="line">';
							if(d.udgigwanGatSuVO.seoulMoonWhaDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ìì¸</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='09'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='06'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.busanMoonWhaDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ë¶ì°</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='08'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='06'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
								
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.daeguMoonWhaDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ëêµ¬ê²½ë¶</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='06'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='06'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.suwonMoonWhaDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ì¸ì²ê²½ê¸°</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='10'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='06'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gwangjuMoonWhaDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ê´ì£¼ì ë¨</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='05'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='06'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.daejeonMoonWhaDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ëì ì¶©ë¨</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='07'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='06'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gangwonMoonWhaDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ê°ì</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='02'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='06'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.chungbukMoonWhaDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ì¶©ë¶</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='14'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='06'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.jeonbukMoonWhaDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ì ë¶</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='12'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='06'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gyeongnamMoonWhaDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ê²½ë¨</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='04'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='06'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.jejuMoonWhaDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ì ì£¼</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='13'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='06'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gyeonggibukbuMoonWhaDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ê²½ê¸°ë¶ë¶</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='03'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='06'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gangwonyoungdongMoonWhaDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ê°ììë</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='01'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='06'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.nationWideMoonWhaDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ì êµ­</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='11'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='06'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							textCont +='</td>';
							textCont +='</tr></tbody></table>';
						}
					}
					if(d.udgigwanGatSuVO.hospitalDutyFree==0&&d.udgigwanGatSuVO.hospitalDisCount==0){
						textCont +='<table class="sp_list">';
						textCont +='<tr><td>';
						textCont +='<a href="#n" target="_blank" title="ìì°½" ì¡°íë ë³ì ë¦¬ì¤í¸ê° ììµëë¤.';
						textCont +='</a><br/>';
						textCont +='</td></tr>';
						textCont +='</table>';
					}else{
						if(d.udgigwanGatSuVO.HospitalDutyFree!=0||d.udgigwanGatSuVO.HospitalDisCount!=0){
							textCont +='<table class="sp_list">';
							textCont +='<caption>ë³ì ì°ë ë¦¬ì¤í¸</caption>';
							textCont +='<colgroup>';
							textCont +='<col class="item1" />';
							textCont +='<col class="item2" />';
							textCont +='<col class="item3" />';
							textCont +='</colgroup>';
							textCont +='<thead>';
							textCont +='<tr>';
							textCont +='<th class="line">êµ¬ë¶</th>';
							textCont +='<th class="line">ë©´ì </th>';
							textCont +='<th>í ì¸</th>';
							textCont +='</tr>';
							textCont +='</thead>';
							textCont +='<tfoot><tr><td colspan="3"></td></tr></tfoot>';
							textCont +='<tbody><tr>';
							textCont +='<td class="line">ë³ì<br /></td>';
							textCont +='<td class="line">';
							if(d.udgigwanGatSuVO.seoulHospitalDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ìì¸</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='09'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='07'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.busanHospitalDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ë¶ì°</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='08'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='07'){
								
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
							
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.daeguHospitalDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ëêµ¬ê²½ë¶</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='06'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='07'){
								
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.suwonHospitalDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ì¸ì²ê²½ê¸°</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='10'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='07'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gwangjuHospitalDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ê´ì£¼ì ë¨</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='05'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='07'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
								
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.daejeonHospitalDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ëì ì¶©ë¨</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='07'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='07'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gangwonHospitalDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ê°ì</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='02'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='07'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.chungbukHospitalDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ì¶©ë¶</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='14'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='07'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.jeonbukHospitalDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ì ë¶</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='12'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='07'){
								
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
								
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gyeongnamHospitalDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ê²½ë¨</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='04'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='07'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.jejuHospitalDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ì ì£¼</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='13'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='07'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gyeonggibukbuHospitalDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ê²½ê¸°ë¶ë¶</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='03'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='07'){
								
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gangwonyoungdongHospitalDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ê°ììë</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='01'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='07'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
								
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.nationWideHospitalDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ì êµ­</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='11'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='07'){
								
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
								
								}
							}
							cnt=0;
							textCont +='</td>';
							textCont +='<td class="line">';
							if(d.udgigwanGatSuVO.seoulHospitalDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ìì¸</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='09'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='07'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.busanHospitalDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ë¶ì°</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='08'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='07'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
								
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.daeguHospitalDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ëêµ¬ê²½ë¶</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='06'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='07'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.suwonHospitalDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ì¸ì²ê²½ê¸°</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='10'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='07'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gwangjuHospitalDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ê´ì£¼ì ë¨</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='05'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='07'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.daejeonHospitalDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ëì ì¶©ë¨</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='07'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='07'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gangwonHospitalDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ê°ì</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='02'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='07'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.chungbukHospitalDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ì¶©ë¶</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='14'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='07'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.jeonbukHospitalDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ì ë¶</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='12'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='07'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gyeongnamHospitalDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ê²½ë¨</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='04'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='07'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.jejuHospitalDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ì ì£¼</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='13'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='07'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
								
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gyeonggibukbuHospitalDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ê²½ê¸°ë¶ë¶</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='03'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='07'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gangwonyoungdongHospitalDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ê°ììë</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='01'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='07'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.nationWideHospitalDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ì êµ­</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='11'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='07'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							textCont +='</td>';
							textCont +='</tr></tbody></table>';
						}
					}
					if(d.udgigwanGatSuVO.hotelDutyFree==0&&d.udgigwanGatSuVO.hotelDisCount==0){
						textCont +='<table class="sp_list">';
						textCont +='<tr><td>';
						textCont +='<a href="#n" target="_blank" title="ìì°½" ì¡°íë ìë° ë¦¬ì¤í¸ê° ììµëë¤.';
						textCont +='</a><br/>';
						textCont +='</td></tr>';
						textCont +='</table>';
					}else{
						if(d.udgigwanGatSuVO.hotelDutyFree!=0||d.udgigwanGatSuVO.hotelDisCount!=0){
							textCont +='<table class="sp_list">';
							textCont +='<caption>ìë° ì°ë ë¦¬ì¤í¸</caption>';
							textCont +='<colgroup>';
							textCont +='<col class="item1" />';
							textCont +='<col class="item2" />';
							textCont +='<col class="item3" />';
							textCont +='</colgroup>';
							textCont +='<thead>';
							textCont +='<tr>';
							textCont +='<th class="line">êµ¬ë¶</th>';
							textCont +='<th class="line">ë©´ì </th>';
							textCont +='<th>í ì¸</th>';
							textCont +='</tr>';
							textCont +='</thead>';
							textCont +='<tfoot><tr><td colspan="3"></td></tr></tfoot>';
							textCont +='<tbody><tr>';
							textCont +='<td class="line">ìë°<br /></td>';
							textCont +='<td class="line">';
							if(d.udgigwanGatSuVO.seoulHotelDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ìì¸</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='09'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='08'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
								
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.busanHotelDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ë¶ì°</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='08'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='08'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.daeguHotelDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ëêµ¬ê²½ë¶</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='06'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='08'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.suwonHotelDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ì¸ì²ê²½ê¸°</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='10'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='08'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gwangjuHotelDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ê´ì£¼ì ë¨</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='05'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='08'){
									if(cnt==0){
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									}else{
										textCont +=', <a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									}
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.daejeonHotelDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ëì ì¶©ë¨</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='07'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='08'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gangwonHotelDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ê°ì</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='02'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='08'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.chungbukHotelDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ì¶©ë¶</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='14'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='08'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.jeonbukHotelDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ì ë¶</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='12'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='08'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gyeongnamHotelDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ê²½ë¨</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='04'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='08'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.jejuHotelDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ì ì£¼</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='13'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='08'){
						
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
						
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gyeonggibukbuHotelDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ê²½ê¸°ë¶ë¶</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='03'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='08'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
								
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gangwonyoungdongHotelDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ê°ììë</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='01'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='08'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.nationWideHotelDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ì êµ­</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='11'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='08'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							textCont +='</td>';
							textCont +='<td class="line">';
							if(d.udgigwanGatSuVO.seoulHotelDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ìì¸</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='09'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='08'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
								
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.busanHotelDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ë¶ì°</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='08'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='08'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
								
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.daeguHotelDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ëêµ¬ê²½ë¶</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='06'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='08'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.suwonHotelDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ì¸ì²ê²½ê¸°</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='10'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='08'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
								
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gwangjuHotelDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ê´ì£¼ì ë¨</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='05'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='08'){
							
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
								
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.daejeonHotelDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ëì ì¶©ë¨</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='07'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='08'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gangwonHotelDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ê°ì</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='02'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='08'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.chungbukHotelDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ì¶©ë¶</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='14'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='08'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.jeonbukHotelDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ì ë¶</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='12'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='08'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gyeongnamHotelDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ê²½ë¨</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='04'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='08'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.jejuHotelDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ì ì£¼</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='13'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='08'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
								
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gyeonggibukbuHotelDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ê²½ê¸°ë¶ë¶</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='03'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='08'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gangwonyoungdongHotelDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ê°ììë</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='01'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='08'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.nationWideHotelDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ì êµ­</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='11'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='08'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							textCont +='</td>';
							textCont +='</tr></tbody></table>';
						}
					}
					if(d.udgigwanGatSuVO.educationDutyFree==0&&d.udgigwanGatSuVO.educationDisCount==0){
						textCont +='<table class="sp_list">';
						textCont +='<tr><td>';
						textCont +='<a href="#n" target="_blank" title="ìì°½" ì¡°íë êµì¡ ë¦¬ì¤í¸ê° ììµëë¤.';
						textCont +='</a><br/>';
						textCont +='</td></tr>';
						textCont +='</table>';
					}else{
						if(d.udgigwanGatSuVO.educationDutyFree!=0||d.udgigwanGatSuVO.educationDisCount!=0){
							textCont +='<table class="sp_list">';
							textCont +='<caption>êµì¡ ì°ë ë¦¬ì¤í¸</caption>';
							textCont +='<colgroup>';
							textCont +='<col class="item1" />';
							textCont +='<col class="item2" />';
							textCont +='<col class="item3" />';
							textCont +='</colgroup>';
							textCont +='<thead>';
							textCont +='<tr>';
							textCont +='<th class="line">êµ¬ë¶</th>';
							textCont +='<th class="line">ë©´ì </th>';
							textCont +='<th>í ì¸</th>';
							textCont +='</tr>';
							textCont +='</thead>';
							textCont +='<tfoot><tr><td colspan="3"></td></tr></tfoot>';
							textCont +='<tbody><tr>';
							textCont +='<td class="line">êµì¡<br /></td>';
							textCont +='<td class="line">';
							if(d.udgigwanGatSuVO.seoulEducationDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ìì¸</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='09'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='02'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.busanEducationDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ë¶ì°</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='08'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='02'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.daeguEducationDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ëêµ¬ê²½ë¶</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='06'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='02'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.suwonEducationDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ì¸ì²ê²½ê¸°</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='10'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='02'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gwangjuEducationDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ê´ì£¼ì ë¨</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='05'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='02'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.daejeonEducationDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ëì ì¶©ë¨</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='07'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='02'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
								
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gangwonEducationDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ê°ì</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='02'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='02'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
								
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.chungbukEducationDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ì¶©ë¶</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='14'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='02'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.jeonbukEducationDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ì ë¶</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='12'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='02'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
								
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gyeongnamEducationDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ê²½ë¨</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='04'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='02'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.jejuEducationDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ì ì£¼</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='13'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='02'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gyeonggibukbuEducationDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ê²½ê¸°ë¶ë¶</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='03'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='02'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gangwonyoungdongEducationDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ê°ììë</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='01'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='02'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.nationWideEducationDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ì êµ­</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='11'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='02'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							textCont +='</td>';
							textCont +='<td class="line">';
							if(d.udgigwanGatSuVO.seoulEducationDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ìì¸</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='09'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='02'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.busanEducationDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ë¶ì°</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='08'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='02'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.daeguEducationDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ëêµ¬ê²½ë¶</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='06'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='02'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
								
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.suwonEducationDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ì¸ì²ê²½ê¸°</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='10'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='02'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
								
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gwangjuEducationDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ê´ì£¼ì ë¨</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='05'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='02'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.daejeonEducationDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ëì ì¶©ë¨</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='07'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='02'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gangwonEducationDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ê°ì</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='02'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='02'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.chungbukEducationDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ì¶©ë¶</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='14'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='02'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.jeonbukEducationDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ì ë¶</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='12'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='02'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gyeongnamEducationDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ê²½ë¨</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='04'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='02'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.jejuEducationDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ì ì£¼</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='13'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='02'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gyeonggibukbuEducationDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ê²½ê¸°ë¶ë¶</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='03'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='02'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gangwonyoungdongEducationDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ê°ììë</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='01'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='02'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
								
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.nationWideEducationDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ì êµ­</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='11'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='02'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							textCont +='</td>';
							textCont +='</tr></tbody></table>';
						}
					}
					if(d.udgigwanGatSuVO.jayeonDutyFree==0&&d.udgigwanGatSuVO.jayeonDisCount==0){
						textCont +='<table class="sp_list">';
						textCont +='<tr><td>';
						textCont +='<a href="#n" target="_blank" title="ìì°½" ì¡°íë ìì°í´ìë¦¼ ë¦¬ì¤í¸ê° ììµëë¤.';
						textCont +='</a><br/>';
						textCont +='</td></tr>';
						textCont +='</table>';
					}else{
						if(d.udgigwanGatSuVO.jayeonDutyFree!=0||d.udgigwanGatSuVO.jayeonDisCount!=0){
							textCont +='<table class="sp_list">';
							textCont +='<caption>ìì°í´ìë¦¼ ì°ë ë¦¬ì¤í¸</caption>';
							textCont +='<colgroup>';
							textCont +='<col class="item1" />';
							textCont +='<col class="item2" />';
							textCont +='<col class="item3" />';
							textCont +='</colgroup>';
							textCont +='<thead>';
							textCont +='<tr>';
							textCont +='<th class="line">êµ¬ë¶</th>';
							textCont +='<th class="line">ë©´ì </th>';
							textCont +='<th>í ì¸</th>';
							textCont +='</tr>';
							textCont +='</thead>';
							textCont +='<tfoot><tr><td colspan="3"></td></tr></tfoot>';
							textCont +='<tbody><tr>';
							textCont +='<td class="line">ìì°í´ìë¦¼<br /></td>';
							textCont +='<td class="line">';
							if(d.udgigwanGatSuVO.seoulJayeonDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ìì¸</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='09'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='12'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.busanJayeonDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ë¶ì°</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='08'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='12'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.daeguJayeonDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ëêµ¬ê²½ë¶</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='06'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='12'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
								
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.suwonJayeonDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ì¸ì²ê²½ê¸°</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='10'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='12'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gwangjuJayeonDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ê´ì£¼ì ë¨</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='05'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='12'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.daejeonJayeonDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ëì ì¶©ë¨</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='07'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='12'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gangwonJayeonDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ê°ì</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='02'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='12'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.chungbukJayeonDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ì¶©ë¶</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='14'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='12'){
								
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
								
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.jeonbukJayeonDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ì ë¶</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='12'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='12'){
								
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gyeongnamJayeonDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ê²½ë¨</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='04'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='12'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.jejuJayeonDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ì ì£¼</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='13'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='12'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gyeonggibukbuJayeonDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ê²½ê¸°ë¶ë¶</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='03'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='12'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gangwonyoungdongJayeonDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ê°ììë</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='01'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='12'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.nationWideJayeonDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ì êµ­</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='11'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='12'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							textCont +='</td>';
							textCont +='<td class="line">';
							if(d.udgigwanGatSuVO.seoulJayeonDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ìì¸</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='09'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='12'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.busanJayeonDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ë¶ì°</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='08'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='12'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.daeguJayeonDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ëêµ¬ê²½ë¶</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='06'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='12'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.suwonJayeonDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ì¸ì²ê²½ê¸°</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='10'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='12'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gwangjuJayeonDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ê´ì£¼ì ë¨</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='05'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='12'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.daejeonJayeonDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ëì ì¶©ë¨</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='07'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='12'){
								
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gangwonJayeonDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ê°ì</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='02'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='12'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.chungbukJayeonDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ì¶©ë¶</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='14'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='12'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.jeonbukJayeonDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ì ë¶</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='12'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='12'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gyeongnamJayeonDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ê²½ë¨</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='04'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='12'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.jejuJayeonDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ì ì£¼</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='13'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='12'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gyeonggibukbuJayeonDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ê²½ê¸°ë¶ë¶</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='03'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='12'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gangwonyoungdongJayeonDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ê°ììë</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='01'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='12'){
								
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.nationWideJayeonDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ì êµ­</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='11'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='12'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							textCont +='</td>';
							textCont +='</tr></tbody></table>';
						}
					}
					if(d.udgigwanGatSuVO.parkDutyFree==0&&d.udgigwanGatSuVO.parkDisCount==0){
						textCont +='<table class="sp_list">';
						textCont +='<tr><td>';
						textCont +='<a href="#n" target="_blank" title="ìì°½" ì¡°íë ê³µì ë¦¬ì¤í¸ê° ììµëë¤.';
						textCont +='</a><br/>';
						textCont +='</td></tr>';
						textCont +='</table>';
					}else{
						if(d.udgigwanGatSuVO.parkDutyFree!=0||d.udgigwanGatSuVO.parkDisCount!=0){
							textCont +='<table class="sp_list">';
							textCont +='<caption>ê³µì ì°ë ë¦¬ì¤í¸</caption>';
							textCont +='<colgroup>';
							textCont +='<col class="item1" />';
							textCont +='<col class="item2" />';
							textCont +='<col class="item3" />';
							textCont +='</colgroup>';
							textCont +='<thead>';
							textCont +='<tr>';
							textCont +='<th class="line">êµ¬ë¶</th>';
							textCont +='<th class="line">ë©´ì </th>';
							textCont +='<th>í ì¸</th>';
							textCont +='</tr>';
							textCont +='</thead>';
							textCont +='<tfoot><tr><td colspan="3"></td></tr></tfoot>';
							textCont +='<tbody><tr>';
							textCont +='<td class="line">ê³µì<br /></td>';
							textCont +='<td class="line">';
							if(d.udgigwanGatSuVO.seoulParkDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ìì¸</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='09'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='01'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.busanParkDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ë¶ì°</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='08'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='01'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.daeguParkDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ëêµ¬ê²½ë¶</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='06'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='01'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.suwonParkDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ì¸ì²ê²½ê¸°</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='10'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='01'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gwangjuParkDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ê´ì£¼ì ë¨</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='05'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='01'){
								
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.daejeonParkDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ëì ì¶©ë¨</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='07'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='01'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gangwonParkDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ê°ì</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='02'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='01'){
								
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.chungbukParkDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ì¶©ë¶</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='14'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='01'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.jeonbukParkDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ì ë¶</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='12'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='01'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gyeongnamParkDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ê²½ë¨</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='04'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='01'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.jejuParkDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ì ì£¼</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='13'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='01'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gyeonggibukbuParkDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ê²½ê¸°ë¶ë¶</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='03'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='01'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
								
									}
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gangwonyoungdongParkDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ê°ììë</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='01'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='01'){
								
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
								
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.nationWideParkDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ì êµ­</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='11'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='01'){
								
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							textCont +='</td>';
							textCont +='<td class="line">';
							if(d.udgigwanGatSuVO.seoulParkDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ìì¸</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='09'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='01'){
								
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.busanParkDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ë¶ì°</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='08'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='01'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
								
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.daeguParkDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ëêµ¬ê²½ë¶</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='06'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='01'){
								
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
								
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.suwonParkDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ì¸ì²ê²½ê¸°</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='10'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='01'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gwangjuParkDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ê´ì£¼ì ë¨</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='05'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='01'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.daejeonParkDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ëì ì¶©ë¨</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='07'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='01'){
								
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
								
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gangwonParkDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ê°ì</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='02'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='01'){
								
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
								
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.chungbukParkDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ì¶©ë¶</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='14'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='01'){
								
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.jeonbukParkDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ì ë¶</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='12'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='01'){
								
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gyeongnamParkDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ê²½ë¨</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='04'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='01'){
								
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.jejuParkDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ì ì£¼</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='13'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='01'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
								
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gyeonggibukbuParkDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ê²½ê¸°ë¶ë¶</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='03'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='01'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gangwonyoungdongParkDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ê°ììë</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='01'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='01'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
								
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.nationWideParkDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ì êµ­</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='11'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='01'){
								
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
								
								}
							}
							cnt=0;
							textCont +='</td>';
							textCont +='</tr></tbody></table>';
						}
					}
					if(d.udgigwanGatSuVO.bankDutyFree==0&&d.udgigwanGatSuVO.bankDisCount==0){
						textCont +='<table class="sp_list">';
						textCont +='<tr><td>';
						textCont +='<a href="#n" target="_blank" title="ìì°½" ì¡°íë ìí ë¦¬ì¤í¸ê° ììµëë¤.';
						textCont +='</a><br/>';
						textCont +='</td></tr>';
						textCont +='</table>';
					}else{
						if(d.udgigwanGatSuVO.bankDutyFree!=0||d.udgigwanGatSuVO.bankDisCount!=0){
							textCont +='<table class="sp_list">';
							textCont +='<caption>ìí ì°ë ë¦¬ì¤í¸</caption>';
							textCont +='<colgroup>';
							textCont +='<col class="item1" />';
							textCont +='<col class="item2" />';
							textCont +='<col class="item3" />';
							textCont +='</colgroup>';
							textCont +='<thead>';
							textCont +='<tr>';
							textCont +='<th class="line">êµ¬ë¶</th>';
							textCont +='<th class="line">ë©´ì </th>';
							textCont +='<th>í ì¸</th>';
							textCont +='</tr>';
							textCont +='</thead>';
							textCont +='<tfoot><tr><td colspan="3"></td></tr></tfoot>';
							textCont +='<tbody><tr>';
							textCont +='<td class="line">ìí<br /></td>';
							textCont +='<td class="line">';
							if(d.udgigwanGatSuVO.seoulBankDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ìì¸</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='09'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='10'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.busanBankDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ë¶ì°</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='08'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='10'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
								
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.daeguBankDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ëêµ¬ê²½ë¶</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='06'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='10'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.suwonBankDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ì¸ì²ê²½ê¸°</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='10'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='10'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gwangjuBankDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ê´ì£¼ì ë¨</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='05'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='10'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.daejeonBankDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ëì ì¶©ë¨</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='07'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='10'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gangwonBankDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ê°ì</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='02'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='10'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.chungbukBankDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ì¶©ë¶</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='14'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='10'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.jeonbukBankDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ì ë¶</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='12'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='10'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gyeongnamBankDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ê²½ë¨</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='04'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='10'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.jejuBankDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ì ì£¼</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='13'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='10'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gyeonggibukbuBankDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ê²½ê¸°ë¶ë¶</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='03'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='10'){
								
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gangwonyoungdongBankDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ê°ììë</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='01'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='10'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.nationWideBankDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ì êµ­</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='11'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='10'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							textCont +='</td>';
							textCont +='<td class="line">';
							if(d.udgigwanGatSuVO.seoulBankDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ìì¸</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='09'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='10'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.busanBankDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ë¶ì°</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='08'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='10'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.daeguBankDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ëêµ¬ê²½ë¶</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='06'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='10'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.suwonBankDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ì¸ì²ê²½ê¸°</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='10'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='10'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gwangjuBankDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ê´ì£¼ì ë¨</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='05'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='10'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.daejeonBankDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ëì ì¶©ë¨</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='07'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='10'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gangwonBankDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ê°ì</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='02'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='10'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.chungbukBankDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ì¶©ë¶</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='14'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='10'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.jeonbukBankDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ì ë¶</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='12'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='10'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gyeongnamBankDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ê²½ë¨</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='04'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='10'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.jejuBankDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ì ì£¼</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='13'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='10'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gyeonggibukbuBankDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ê²½ê¸°ë¶ë¶</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='03'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='10'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gangwonyoungdongBankDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ê°ììë</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='01'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='10'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.nationWideBankDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ì êµ­</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='11'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='10'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							textCont +='</td>';
							textCont +='</tr></tbody></table>';
						}
					}
					if(d.udgigwanGatSuVO.foodDutyFree==0&&d.udgigwanGatSuVO.foodDisCount==0){
						textCont +='<table class="sp_list">';
						textCont +='<tr><td>';
						textCont +='<a href="#n" target="_blank" title="ìì°½" ì¡°íë ììì  ë¦¬ì¤í¸ê° ììµëë¤.';
						textCont +='</a><br/>';
						textCont +='</td></tr>';
						textCont +='</table>';
					}else{
						if(d.udgigwanGatSuVO.foodDutyFree!=0||d.udgigwanGatSuVO.foodDisCount!=0){
							textCont +='<table class="sp_list">';
							textCont +='<caption>ììì  ì°ë ë¦¬ì¤í¸</caption>';
							textCont +='<colgroup>';
							textCont +='<col class="item1" />';
							textCont +='<col class="item2" />';
							textCont +='<col class="item3" />';
							textCont +='</colgroup>';
							textCont +='<thead>';
							textCont +='<tr>';
							textCont +='<th class="line">êµ¬ë¶</th>';
							textCont +='<th class="line">ë©´ì </th>';
							textCont +='<th>í ì¸</th>';
							textCont +='</tr>';
							textCont +='</thead>';
							textCont +='<tfoot><tr><td colspan="3"></td></tr></tfoot>';
							textCont +='<tbody><tr>';
							textCont +='<td class="line">ììì <br /></td>';
							textCont +='<td class="line">';
							if(d.udgigwanGatSuVO.seoulFoodDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ìì¸</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='09'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='11'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.busanFoodDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ë¶ì°</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='08'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='11'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.daeguFoodDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ëêµ¬ê²½ë¶</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='06'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='11'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.suwonFoodDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ì¸ì²ê²½ê¸°</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='10'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='11'){
								
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gwangjuFoodDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ê´ì£¼ì ë¨</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='05'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='11'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.daejeonFoodDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ëì ì¶©ë¨</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='07'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='11'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gangwonFoodDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ê°ì</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='02'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='11'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.chungbukFoodDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ì¶©ë¶</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='14'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='11'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.jeonbukFoodDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ì ë¶</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='12'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='11'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gyeongnamFoodDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ê²½ë¨</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='04'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='11'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.jejuFoodDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ì ì£¼</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='13'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='11'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gyeonggibukbuFoodDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ê²½ê¸°ë¶ë¶</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='03'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='11'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gangwonyoungdongFoodDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ê°ììë</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='01'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='11'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.nationWideFoodDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ì êµ­</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='11'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='11'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							textCont +='</td>';
							textCont +='<td class="line">';
							if(d.udgigwanGatSuVO.seoulFoodDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ìì¸</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='09'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='11'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.busanFoodDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ë¶ì°</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='08'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='11'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
								
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.daeguFoodDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ëêµ¬ê²½ë¶</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='06'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='11'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
								
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.suwonFoodDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ì¸ì²ê²½ê¸°</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='10'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='11'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gwangjuFoodDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ê´ì£¼ì ë¨</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='05'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='11'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.daejeonFoodDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ëì ì¶©ë¨</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='07'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='11'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gangwonFoodDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ê°ì</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='02'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='11'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.chungbukFoodDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ì¶©ë¶</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='14'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='11'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.jeonbukFoodDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ì ë¶</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='12'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='11'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gyeongnamFoodDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ê²½ë¨</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='04'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='11'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.jejuFoodDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ì ì£¼</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='13'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='11'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gyeonggibukbuFoodDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ê²½ê¸°ë¶ë¶</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='03'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='11'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gangwonyoungdongFoodDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ê°ììë</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='01'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='11'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.nationWideFoodDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ì êµ­</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='11'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='11'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							textCont +='</td>';
							textCont +='</tr></tbody></table>';
						}
					}
					if(d.udgigwanGatSuVO.etcDutyFree==0&&d.udgigwanGatSuVO.etcDisCount==0){
						textCont +='<table class="sp_list">';
						textCont +='<tr><td>';
						textCont +='<a href="#n" target="_blank" title="ìì°½" ì¡°íë ê¸°í ë¦¬ì¤í¸ê° ììµëë¤.';
						textCont +='</a><br/>';
						textCont +='</td></tr>';
						textCont +='</table>';
					}else{
						if(d.udgigwanGatSuVO.etcDutyFree!=0||d.udgigwanGatSuVO.etcDisCount!=0){
							textCont +='<table class="sp_list">';
							textCont +='<caption>ê¸°í ì°ë ë¦¬ì¤í¸</caption>';
							textCont +='<colgroup>';
							textCont +='<col class="item1" />';
							textCont +='<col class="item2" />';
							textCont +='<col class="item3" />';
							textCont +='</colgroup>';
							textCont +='<thead>';
							textCont +='<tr>';
							textCont +='<th class="line">êµ¬ë¶</th>';
							textCont +='<th class="line">ë©´ì </th>';
							textCont +='<th>í ì¸</th>';
							textCont +='</tr>';
							textCont +='</thead>';
							textCont +='<tfoot><tr><td colspan="3"></td></tr></tfoot>';
							textCont +='<tbody><tr>';
							textCont +='<td class="line">ê¸°í<br /></td>';
							textCont +='<td class="line">';
							if(d.udgigwanGatSuVO.seoulEtcDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ìì¸</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='09'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='05'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.busanEtcDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ë¶ì°</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='08'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='05'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.daeguEtcDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ëêµ¬ê²½ë¶</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='06'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='05'){
								
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.suwonEtcDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ì¸ì²ê²½ê¸°</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='10'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='05'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gwangjuEtcDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ê´ì£¼ì ë¨</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='05'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='05'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.daejeonEtcDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ëì ì¶©ë¨</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='07'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='05'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gangwonEtcDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ê°ì</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='02'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='05'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.chungbukEtcDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ì¶©ë¶</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='14'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='05'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.jeonbukEtcDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ì ë¶</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='12'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='05'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gyeongnamEtcDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ê²½ë¨</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='04'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='05'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.jejuEtcDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ì ì£¼</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='13'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='05'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gyeonggibukbuEtcDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ê²½ê¸°ë¶ë¶</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='03'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='05'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gangwonyoungdongEtcDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ê°ììë</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='01'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='05'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.nationWideEtcDutyFree!=0){
								textCont +='<p class="special_sub_area"><h2>ì êµ­</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='11'&&d.list[j].udae_gbcd=='01'&&d.list[j].udggeopjong_gbcd=='05'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							textCont +='</td>';
							textCont +='<td class="line">';
							if(d.udgigwanGatSuVO.seoulEtcDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ìì¸</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='09'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='05'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.busanEtcDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ë¶ì°</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='08'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='05'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.daeguEtcDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ëêµ¬ê²½ë¶</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='06'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='05'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.suwonEtcDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ì¸ì²ê²½ê¸°</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='10'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='05'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gwangjuEtcDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ê´ì£¼ì ë¨</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='05'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='05'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
								
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.daejeonEtcDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ëì ì¶©ë¨</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='07'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='05'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gangwonEtcDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ê°ì</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='02'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='05'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.chungbukEtcDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ì¶©ë¶</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='14'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='05'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.jeonbukEtcDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ì ë¶</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='12'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='05'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gyeongnamEtcDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ê²½ë¨</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='04'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='05'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.jejuEtcDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ì ì£¼</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='13'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='05'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gyeonggibukbuEtcDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ê²½ê¸°ë¶ë¶</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='03'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='05'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
								
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.gangwonyoungdongEtcDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ê°ììë</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='01'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='05'){
									
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							if(d.udgigwanGatSuVO.nationWideEtcDisCount!=0){
								textCont +='<p class="special_sub_area"><h2>ì êµ­</h2></p>';
							}
							for(var j=0; j<d.list.length; j++){
								if(d.list[j].udjiyeok_cd=='11'&&d.list[j].udae_gbcd=='02'&&d.list[j].udggeopjong_gbcd=='05'){
								
										textCont +='<a href="#n" onclick="udgigwansangseJHPopup('+d.list[j].mmgudgigwan_cd+')" rel="view_special" name="'+cnt+'" class="hand">';
										textCont +=d.list[j].udae_ggm;
										textCont +='</a><br/>';
										cnt++;
									
								}
							}
							cnt=0;
							textCont +='</td>';
							textCont +='</tr></tbody></table>';
						}
					}

			$("#areaList").html(textCont);
		});
}
// ìì¸ì¡°í í¸ì¶í¨ì
	function udgigwansangseJH(mmgudgigwan_cd){
		var url = "https://open.mma.go.kr/caisGGGS/bymmgSangSeAjaxJsonCall.json";
		//var url = "http://gggbs.oma.go.kr/caisGGGS/bymmgSangSeAjaxJsonCall.json";

		var textCont ='';
		url = url+"?"+"mmgudgigwan_cd="+mmgudgigwan_cd+"&callback=?";
		$.getJSON(url, function(d){
			if(d.success==true){
					textCont +='<div class="pop_wrap">';
					textCont +='<div class="pop_btn">';
					textCont +='<a href="#n" onclick="return closeJH();"><img src="/images/temple/main/pop_bg_btn.gif" alt="íìì°½ ë«ê¸°" /></a>';
					textCont +='</div><div class="pop_wrap_body">';
					// ì°ëê¸°ê´ëª
					textCont +='<div class="body_01">';
					textCont += d.udgigwanVO.udae_ggm;
					textCont +='</div>';
					// ìì¸ì¡°í
					textCont +='<div class="body_02">';
					textCont +='<div class="body_02_01">';
					if(d.udgigwanVO.udhangmok_gbcd=='01'){
						textCont += 'ã ê´ë/ì£¼ì°¨ë£ : ';
					}else if(d.udgigwanVO.udhangmok_gbcd=='02'){
						textCont += 'ã ê´ëë£ : ';
					}else if(d.udgigwanVO.udhangmok_gbcd=='03'){
						textCont += 'ã ê´ê³ ë£ : ';
					}else if(d.udgigwanVO.udhangmok_gbcd=='04'){
						textCont += 'ã êµì¡ë¹ : ';
					}else if(d.udgigwanVO.udhangmok_gbcd=='05'){
						textCont += 'ã êµ¬ìë¹ : ';
					}else if(d.udgigwanVO.udhangmok_gbcd=='06'){
						textCont += 'ã ê¸ë¦¬ : ';
					}else if(d.udgigwanVO.udhangmok_gbcd=='07'){
						textCont += 'ã ììë£ : ';
					}else if(d.udgigwanVO.udhangmok_gbcd=='08'){
						textCont += 'ã ìë°ë£ : ';
					}else if(d.udgigwanVO.udhangmok_gbcd=='09'){
						textCont += 'ã ìë : ';
					}else if(d.udgigwanVO.udhangmok_gbcd=='10'){
						textCont += 'ã ì´ì©ë£ : ';
					}else if(d.udgigwanVO.udhangmok_gbcd=='11'){
						textCont += 'ã ìì¥/ì£¼ì°¨ë£ : ';
					}else if(d.udgigwanVO.udhangmok_gbcd=='12'){
						textCont += 'ã ìì¥ë£ : ';
					}else if(d.udgigwanVO.udhangmok_gbcd=='13'){
						textCont += 'ã ì¥íê¸ : ';
					}else if(d.udgigwanVO.udhangmok_gbcd=='14'){
						textCont += 'ã ì£¼ì°¨ë£ : ';
					}else if(d.udgigwanVO.udhangmok_gbcd=='15'){
						textCont += 'ã ì§ë£ë¹ : ';
					}
					textCont +='</div>';
					textCont +='<div class="body_02_02">';
					textCont += d.udgigwanVO.udsangse_cn;
					textCont +='</div>';
					textCont +='<div class="body_03">';
					textCont +='<div class="body_03_01">';
					textCont += 'ã ì°ë½ì² : ';
					textCont +='</div>';
					textCont +='<div class="body_03_02">';
					textCont += d.udgigwanVO.udgigwan_telno;
					textCont +='</div>';
					textCont +='</div>';
					textCont +='<div class="body_04">â» ë¬¸ì : ';
					if(d.udgigwanVO.drjbc_cd=='01'){
						textCont += 'ë³ë¬´ì²­ ë³¸ì²­ (042-481-2993)';
					}else if(d.udgigwanVO.drjbc_cd=='02'){
						textCont += 'ìì¸ì§ë°©ë³ë¬´ì²­ (02-820-4344)';
					}else if(d.udgigwanVO.drjbc_cd=='03'){
						textCont += 'ë¶ì°ì§ë°©ë³ë¬´ì²­ (051-667-5227)';
					}else if(d.udgigwanVO.drjbc_cd=='04'){
						textCont += 'ëêµ¬Â·ê²½ë¶ì§ë°©ë³ë¬´ì²­ (053-607-6427)';
					}else if(d.udgigwanVO.drjbc_cd=='05'){
						textCont += 'ê²½ì¸ì§ë°©ë³ë¬´ì²­ (031-240-7321)';
					}else if(d.udgigwanVO.drjbc_cd=='06'){
						textCont += 'ê´ì£¼Â·ì ë¨ì§ë°©ë³ë¬´ì²­ (062-230-4420)';
					}else if(d.udgigwanVO.drjbc_cd=='07'){
						textCont += 'ëì Â·ì¶©ë¨ì§ë°©ë³ë¬´ì²­ (042-250-4227)';
					}else if(d.udgigwanVO.drjbc_cd=='08'){
						textCont += 'ê°ìì§ë°©ë³ë¬´ì²­ (033-240-6227)';
					}else if(d.udgigwanVO.drjbc_cd=='09'){
						textCont += 'ì¶©ë¶ì§ë°©ë³ë¬´ì²­ (043-270-1322)';
					}else if(d.udgigwanVO.drjbc_cd=='10'){
						textCont += 'ì ë¶ì§ë°©ë³ë¬´ì²­ (063-281-3227)';
					}else if(d.udgigwanVO.drjbc_cd=='11'){
						textCont += 'ê²½ë¨ì§ë°©ë³ë¬´ì²­ (055-279-9396)';
					}else if(d.udgigwanVO.drjbc_cd=='12'){
						textCont += 'ì ì£¼ì§ë°©ë³ë¬´ì²­ (064-720-3225)';
					}else if(d.udgigwanVO.drjbc_cd=='13'){
						textCont += 'ì¸ì²ì§ë°©ë³ë¬´ì§ì²­ (032-454-2321)';
					}else if(d.udgigwanVO.drjbc_cd=='14'){
						textCont += 'ê²½ê¸°ë¶ë¶ë³ë¬´ì§ì²­ (031-870-0222)';
					}else if(d.udgigwanVO.drjbc_cd=='15'){
						textCont += 'ê°ììëë³ë¬´ì§ì²­ (033-649-4235)';
					}
					textCont +='</div>';
					textCont +='<div class="body_05">â ë³ì­ëªë¬¸ê°ì¦ ë°ëì ì§ì°¸</div>';
					//textCont +='<div class="body_05"><a href="/hall/special/MapViewDetail.do?udae_ggm='+d.udgigwanVO.udae_ggm+'&udgigwan_telno='+d.udgigwanVO.udgigwan_telno+'&wido_vl=37.4977110&gyeongdo_vl=127.0284390">ì§ëë³´ê¸°</a></div>';
					textCont +='</div></div>';
			}else{
				alert("íµì ì´ ìííì§ ììµëë¤.\në¤ì ìëí´ ì£¼ì¸ì");
			}
			$("#div_special_detail1").html(textCont);
		});
	}
function udgigwansangseJHPopup(mmgudgigwan_cd){
  var option = "width=530px, height=460px, resizable=no, toolbar=no, status=no";
  window.open("/temple/listdetail.do?mmgudgigwan_cd="+mmgudgigwan_cd, "udgigwansangse", option);
}
function closeJH(){
	self.close();
}
