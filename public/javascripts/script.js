




   function addtocart(proid){

        $.ajax({
            url:"/addtocart/"+proid,
            method:'get',
            success:(response)=>{
                console.log(response)
                if(response.status){
                    console.log(response.status)
                    let count=$('#cart-count').html()
                    count=parseInt(count)+1
                    $("#cart-count").html(count)
                    // location.reload()
                    // alert(response)
                    console.log(response)
                }else if(response.status==false){
                    console.log(response)
                    // alert(response)
                }else{
                    // alert('redirect')
                    location.href='/signin'
                }
            
            }
        })
    }




    // function changeQuantity(cartId){
    //     // console.log(cartId,proId,count)
    //     $.ajax({
    //         url:"/changeproductquantity/"+cartId,
    //         method:'get',
    //         success:(response)=>{
    //             alert(response)
    //         }
    //     })
    // }



    // function changeQuantity(cartId,proId,count){
    //     console.log(cartId,proId,count)
    //     $.ajax({
    //         url:'/changeproductquantity',
    //         data:{
    //             cart:cartId,
    //             product:proId,
    //             count:count,
    //         },
    //         method:'post',
    //         success:(response)=>{
    //             alert(response)
    //         }
    //     })
    // }



    // function addtocart(proid){
    //     $.ajax({
    //         url:"/addtocart/"+proid,
    //         method:'get',
    //         success:(response)=>{
    //             if(response.status){
    //                 let count=$('#cart-count').html()
    //                 count=parseInt(count)+1
    //                 $("#cart-count").html(count)
    //             }
    //             // alert(response)
    //         }
    //     })
    // }