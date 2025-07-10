"use strict";

let isMenuOpen = false;
let menuItemsData = [];
let subMenuStack = [];
let keybindConfig = 'F1';

$(document).ready(function() {
    window.addEventListener("message", function(event) {
        const data = event.data;
        
        if (data.action === "ui") {
            keybindConfig = data.keybind || 'F1';
            
            if (data.radial) {
                openMenu(data.items);
            } else {
                closeMenu();
            }
        } else if (data.action === "setItems") {
            if (data.items) {
                openMenu(data.items);
            }
        }
    });

    // Close on escape key
    $(document).on("keydown", function(e) {
        if (e.key === "Escape" && isMenuOpen) {
            closeMenu();
        }
    });
});

const openMenu = (items) => {
    menuItemsData = formatItems(items);
    updateMenuItems(menuItemsData);
    document.getElementById('circle-menu').style.display = 'flex';
    isMenuOpen = true;
    
    // Handle keybind behavior
    $(document).off("keyup.radialMenu").on("keyup.radialMenu", function(e) {
        if (e.key === keybindConfig && isMenuOpen) {
            closeMenu();
        }
    });
}

const formatItems = (items) => {
    if (!items || !Array.isArray(items)) return [];
    
    return items.map(item => {
        // Ensure all items have a valid title to prevent errors
        const title = item.title || item.header || item.id || 'Option';
        
        return {
            id: item.id || '',
            title: title,
            icon: getIconClass(item.icon),
            type: item.type || '',
            event: item.event || '',
            shouldClose: item.shouldClose !== false,
            items: item.items || [],
            data: item.data || {}
        };
    });
};

const getIconClass = (icon) => {
    if (!icon) return 'fas fa-circle';
    
    // If icon already includes fa- prefix
    if (icon.includes('fa-')) {
        return icon;
    }
    
    // Add the proper prefix (assuming solid by default)
    return `fas fa-${icon}`;
};

const updateMenuItems = (itemsData) => {
    const menuItemsContainer = document.getElementById('menu-items-container');
    if (!menuItemsContainer) return;
    
    // Fade out existing items
    const items = menuItemsContainer.querySelectorAll('.menu-item-wrapper');
    items.forEach(item => {
        item.style.transition = 'opacity 0.1s ease-out';
        item.style.opacity = '0';
    });

    // Clear and create new items
    setTimeout(() => {
        menuItemsContainer.innerHTML = '';

        itemsData.forEach((itemData, index) => {
            const itemWrapper = document.createElement('div');
            itemWrapper.classList.add('menu-item-wrapper');
            itemWrapper.setAttribute('data-index', index);

            const menuItem = document.createElement('div');
            menuItem.classList.add('menu-item');
            
            // Add special classes if needed
            if (itemData.type === 'blue') {
                menuItem.classList.add('blue-item');
            }
            if (itemData.type === 'important') {
                menuItem.classList.add('important');
            }

            // Create icon
            const icon = document.createElement('i');
            icon.className = itemData.icon;
            
            // Create label
            const label = document.createElement('div');
            label.className = 'menu-item-label';
            label.textContent = itemData.title || '';
            
            // Append elements
            menuItem.appendChild(icon);
            menuItem.appendChild(label);
            itemWrapper.appendChild(menuItem);
            menuItemsContainer.appendChild(itemWrapper);
        });

        // Position items in circle
        const updatedItems = document.querySelectorAll('.menu-item-wrapper');
        const itemCount = updatedItems.length;
        const angleIncrement = 360 / itemCount;
        
        // Smaller radius for the menu
        const radius = 180; // Reduced from 200 to make menu smaller overall

        updatedItems.forEach((item, index) => {
            const angle = angleIncrement * index - 90; // Start from top
            const radians = angle * (Math.PI / 180);
            const translateX = radius * Math.cos(radians);
            const translateY = radius * Math.sin(radians);

            item.style.setProperty('--translate-x', `${translateX}px`);
            item.style.setProperty('--translate-y', `${translateY}px`);
            
            // Add a slight delay for a more natural animation
            setTimeout(() => {
                item.style.opacity = '1';
            }, index * 30);
        });

        // Add event listeners
        addHoverListeners();
        addClickListeners();
    }, 100);
};

const setCentralText = (text) => {
    const centralText = document.getElementById('central-text');
    if (!centralText) return;
    
    // Fix: ensure text is a string
    const safeText = text || '';
    centralText.textContent = safeText;
    
    if (!safeText) {
        centralText.classList.add('hidden');
    } else {
        centralText.classList.remove('hidden');
    }
};

// Fixed hover listener with better error handling
const addHoverListeners = () => {
    const items = document.querySelectorAll('.menu-item-wrapper');
    
    items.forEach(item => {
        const index = parseInt(item.getAttribute('data-index') || '0');
        const menuItem = item.querySelector('.menu-item');
        
        if (!menuItem) return;
        
        menuItem.addEventListener('mouseenter', () => {
            try {
                // Make sure index is valid and itemData exists
                if (menuItemsData && Array.isArray(menuItemsData) && 
                    index >= 0 && index < menuItemsData.length) {
                    const itemData = menuItemsData[index];
                    if (itemData) {
                        setCentralText(itemData.title || '');
                    }
                }
            } catch (error) {
                console.error('Error in hover handler:', error);
                setCentralText('');
            }
        });
        
        menuItem.addEventListener('mouseleave', () => {
            setCentralText('');
        });
    });
};

const addClickListeners = () => {
    const items = document.querySelectorAll('.menu-item-wrapper');
    
    items.forEach(item => {
        const index = parseInt(item.getAttribute('data-index') || '0');
        const menuItem = item.querySelector('.menu-item');
        
        if (!menuItem) return;
        
        menuItem.addEventListener('click', () => {
            try {
                // Make sure index is valid
                if (menuItemsData && Array.isArray(menuItemsData) && 
                    index >= 0 && index < menuItemsData.length) {
                    const itemData = menuItemsData[index];
                    
                    // Handle submenu
                    if (itemData.items && itemData.items.length > 0) {
                        // Store current menu for back navigation
                        subMenuStack.push(menuItemsData);
                        menuItemsData = formatItems(itemData.items);
                        updateMenuItems(menuItemsData);
                        return;
                    }
                    
                    // Send event to game
                    $.post('https://qb-radialmenu/selectItem', JSON.stringify({
                        itemData: itemData
                    }));
                    
                    // Close menu if needed
                    if (itemData.shouldClose) {
                        closeMenu();
                    }
                }
            } catch (error) {
                console.error('Error in click handler:', error);
                closeMenu();
            }
        });
    });
};

const closeMenu = () => {
    const menu = document.getElementById('circle-menu');
    if (!menu) return;
    
    const menuItems = document.querySelectorAll('.menu-item-wrapper');

    // Animation to close
    menuItems.forEach(item => {
        item.style.animation = 'retract 0.15s cubic-bezier(0.1, 0.9, 0.2, 1) forwards';
    });

    // Hide after animation
    setTimeout(() => {
        menu.style.display = 'none';
        isMenuOpen = false;
        subMenuStack = []; // Clear submenu history
        
        // Clean up event listeners
        $(document).off("keyup.radialMenu");
        
        // Notify game
        $.post('https://qb-radialmenu/closeRadial', JSON.stringify({}));
    }, 150);
};
