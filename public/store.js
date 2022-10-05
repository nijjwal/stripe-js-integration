//Important: check if the document is loaded before tyring to invoke JS
//methods on DOM element
if(document.readyState == 'loading'){
    document.addEventListener('DOMContentLoaded', ready)
}else{
    ready()
}


//Event listener for items that are already loaded into the HTML  Document
function ready(){
    //code for remove only
    var removeCartItemButtons = document.getElementsByClassName('btn-danger');
    for(var i=0; i<removeCartItemButtons.length; i++){
        var button = removeCartItemButtons[i];
        button.addEventListener('click', removeCartItem)
    }

    //code for quantity only
    var quantityInputs = document.getElementsByClassName('cart-quantity-input');
    for(var i=0; i<quantityInputs.length; i++){
        var input = quantityInputs[i];
        input.addEventListener('change', quantityChanged)
    }

    //code for adding items to cart only
    var addToCartButtons = document.getElementsByClassName('shop-item-button');
    for(var i=0; i<addToCartButtons.length; i++){
        var button = addToCartButtons[i];
        button.addEventListener('click', addToCart);
    }

    //code for purchage last button
    document.getElementsByClassName('btn-purchase')[0].addEventListener('click', purhcaseClicked);
}


var stripeHandler = StripeCheckout.configure({
    key: stripePublicKey,
    locale: 'auto',
    token: function(token){
        var items = [];
        var cartItemContainer = document.getElementsByClassName('cart-items')[0];
        var cartRows = cartItemContainer.getElementsByClassName('cart-row')

        for(var i=0; i<cartRows.length; i++){
            var cartRow = cartRows[i];
            var quantityElement = cartRow.getElementsByClassName('cart-quantity-input')[0];
            var quantity= quantityElement.value;
            var id = cartRow.dataset.itemId;
            items.push({
                id: id,
                quantity: quantity
            });
        }

        fetch('/purchase', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }, 
            body: JSON.stringify({
                stripeTokenId: token.id,
                items: items
            })
        }).then(function(res){
            return res.json();
        }).then(function(data){
            alert(data.message);

            var cartItems = document.getElementsByClassName('cart-items')[0];
            while(cartItems.hasChildNodes()){
                cartItems.removeChild(cartItems.firstChild)
            }

             updateCartTotal()
        }).catch(function(error){
            console.log(error)
        })

    }
})

function purhcaseClicked(){
    
    var priceElement = document.getElementsByClassName('cart-total-price')[0];
    var price =  parseFloat(priceElement.innerText.replace('$',''))*100

    stripeHandler.open({
        amount: price
    })
}

function removeCartItem(){           
        var buttonClicked = event.target
        buttonClicked.parentElement.parentElement.remove()
        updateCartTotal()
}

function quantityChanged(event){
    var input = event.target;
    if(isNaN(input.value) || input.value <=0 ){
        input.value = 1;
    }

    updateCartTotal();
}

function addToCart(event){
    var button = event.target;
    var shopItem = button.parentElement.parentElement;
    var title = shopItem.getElementsByClassName('shop-item-title')[0].innerText;
    var price = shopItem.getElementsByClassName('shop-item-price')[0].innerText;
    var imageSrc = shopItem.getElementsByClassName('shop-item-image')[0].src;
    var id = shopItem.dataset.itemId;
    console.log(title, price, imageSrc, id);

    addItemToCart(title, price, imageSrc, id)
    updateCartTotal()
}


//When we add new HTML elements to the Document we need to make sure 
//to hookup all the event listeners as these new HTML elements weren't 
//there initially when we setup the event listener in the ready method.
// V. Important Step
function addItemToCart(title, price, imageSrc, id){
    var cartRow = document.createElement('div');
    cartRow.dataset.itemId = id;
    cartRow.classList.add('cart-row');
    var cartItems = document.getElementsByClassName('cart-items')[0];
    
    //Check if the item already exists in the shopping cart - starts
    var cartItemNames = cartItems.getElementsByClassName('cart-item-title');
    for(var i=0; i<cartItemNames.length; i++){
        if(cartItemNames[i].innerText == title){
            alert('This item is already added to the cart!');
            return;
        }
    }
    //Check if the item already exists in the shopping cart - ends

    var cartRowContents = `
            <div class="cart-item cart-column">
                <img class="cart-item-image" src="${imageSrc}" width="100" height="100">
                <span class="cart-item-title">${title}</span>
            </div>
            <span class="cart-price cart-column">${price}</span>
            <div class="cart-quantity cart-column">
                <input class="cart-quantity-input" type="number" value="1">
                <button class="btn btn-danger" type="button">REMOVE</button>
            </div>
        `;

    cartRow.innerHTML = cartRowContents;
    cartItems.append(cartRow);

    //since event listener was added as soon as the page was loaded, 
    //we need to add it again when the new element is added. 
    cartRow.getElementsByClassName('btn-danger')[0].addEventListener('click', removeCartItem);
    cartRow.getElementsByClassName('cart-quantity')[0].addEventListener('change',quantityChanged);
}


function updateCartTotal(){
    //returns an array of element 
    var cartItemContainer = document.getElementsByClassName('cart-items')[0]
    var cartRows = cartItemContainer.getElementsByClassName('cart-row')
    var total = 0;

    for(var i=0; i<cartRows.length; i++){
        var cartRow = cartRows[i];
        var priceElement = cartRow.getElementsByClassName('cart-price')[0];
        var quantityElement = cartRow.getElementsByClassName('cart-quantity-input')[0];
        var price = parseFloat(priceElement.innerText.replace('$',''))
        var quantity = quantityElement.value
        total = total + (price * quantity)
        console.log(total)
    }

    //always round to two decimal places
    total = Math.round(total * 100)  / 100
    document.getElementsByClassName('cart-total-price')[0].innerText = '$' + total;
}