/*******************************************************************************
 * ê³µê°ê°ë°©ì íµí´ ì°ëê¸°ê´ ì ë³´ë¥¼ í¸ì¶í¨
 ******************************************************************************/
function udgigwansangseJHPopup(udgigwan_cd,mcValue){
  var option = "width=530px, height=460px, scrollbars=yes, resizable=no, toolbar=no, status=no";
  window.open("/udgg/listdetail.do?udgigwan_cd="+udgigwan_cd+"&mcValue="+mcValue, "udgigwansangse", option);
}

// ìì¸ì¡°í í¸ì¶í¨ì
	function udgigwansangseJH(udgigwan_cd, mcValue){
		var url = "https://open.mma.go.kr/caisGGGS/mmaudggSangSeAjaxJsonCall.json";
		if(mcValue == '0002456'){
			//var url = "http://localhost:8080/caisGGGS/mmaudggSangSeAjaxJsonCall.json";
			url = "https://open.mma.go.kr/caisGGGS/mmaudggSangSeAjaxJsonCall.json";
			//var url = "http://gggbs.oma.go.kr/caisGGGS/bymmgSangSeAjaxJsonCall.json";
		}else{
			url = "https://open.mma.go.kr/caisGGGS/mmanrsrSangSeAjaxJsonCall.json"; //ëë¼ì¬ëê°ê²ì¡°í json
		}
		var textCont ='';
		url = url+"?"+"udgigwan_cd="+udgigwan_cd+"&callback=?";
		$.getJSON(url, function(d){
			if(d.success==true){
					textCont +='<div class="pop_wrap">';
					textCont +='<div class="pop_btn">';
					textCont +='<a href="#n" onclick="return closeJH();"><img src="/images/temple/main/pop_bg_btn_udgg.gif" alt="íìì°½ ë«ê¸°" /></a>';
					textCont +='</div><div class="pop_wrap_body">';
					// ì°ëê¸°ê´ëª
					textCont +='<div class="body_01">';
					textCont += d.udgigwanVO.udae_ggm;
					textCont +='</div>';
					textCont +='<div class="body_02">';
					/* ì£¼ì/ì°ë½ì²
					textCont +='<div class="body_02_01">';
					textCont += 'ã ì£¼ì/ì°ë½ì² : ';
					textCont +='</div>';
					textCont +='<div class="body_02_02">';
					textCont += d.udgigwanVO.addr;
					textCont += ' / ';
					textCont += d.udgigwanVO.udgigwan_telno;
					textCont +='</div>';*/
					
					//ì°ëìì¢					
					textCont +='<div class="body_02_01">';
					textCont += 'ã ì°ëìì¢ : ';
					textCont +='</div>';
					textCont +='<div class="body_02_02">';
					textCont += d.udgigwanVO.udggeopjong_gbnm;
					textCont +='</div>';
					//íì½ê¸°ê°
					textCont +='<div class="body_03">';
					textCont +='<div class="body_03_01">';
					textCont += 'ã íì½ê¸°ê° : ';
					textCont +='</div>';
					textCont +='<div class="body_03_02">';
					textCont += d.udgigwanVO.hyjeokyong_sjdt;
					textCont += ' ~ ';
					if(d.udgigwanVO.hyjeokyong_jrdt == "9999ë 12ì 31ì¼"){
						textCont += 'íì½ì¢ë£ìê¹ì§';
					}else{
						textCont += d.udgigwanVO.hyjeokyong_jrdt;
					}
					textCont +='</div>';
					textCont +='</div>';
					
					//ì°ëëì
					textCont +='<div class="body_03">';
					textCont +='<div class="body_03_01">';
					textCont += 'ã ì°ëëì : ';
					textCont +='</div>';
					textCont +='<div class="body_03_02">';
					textCont += d.udgigwanVO.uddaesang_cn;
					textCont +='</div>';
					textCont +='</div>';
					
					//ì§ì­ì í
					textCont +='<div class="body_03">';
					textCont +='<div class="body_03_01">';
					textCont += 'ã ì§ì­ì í : ';
					textCont +='</div>';
					textCont +='<div class="body_03_02">';
					textCont += d.udgigwanVO.udjyjehan_cn;
					textCont +='</div>';
					textCont +='</div>';
					//ì¦ë¹ìë£
					textCont +='<div class="body_03">';
					textCont +='<div class="body_03_01">';
					textCont += 'ã ì¦ë¹ìë£ : ';
					textCont +='</div>';
					textCont +='<div class="body_03_02">';
					textCont += d.udgigwanVO.udjbjaryo_cn;
					textCont +='</div>';
					textCont +='</div>';
					//ì°ëìì¸
					textCont +='<div class="body_03">';
					textCont +='<div class="body_03_01">';
					textCont += 'ã ì°ëìì¸ : ';
					textCont +='</div>';
					textCont +='<div class="body_03_02">';
					textCont += d.udgigwanVO.udsangse_cn;
					textCont +='</div>';
					textCont +='</div>';
					
					textCont +='</div>';//body_02ë¥¼ ë«ë ê². 
					//ìëìª½ ê³µë°±ì ìí´ DIVíë ì¶ê°
					textCont +='<div class="body_04"></div>';
					
					textCont +='</div></div></div>';
			}else{
				alert("íµì ì´ ìííì§ ììµëë¤.\në¤ì ìëí´ ì£¼ì¸ì");
			}
			$("#div_special_detail1").html(textCont);
		});
	}

function closeJH(){
	self.close();
}
