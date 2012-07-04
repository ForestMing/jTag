/*  This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.*/
(function($){

  jTag = {

    listeners: {
      imageListener: function(image){

        image.on('click', function(event){

          /* add window if tagging is enabled and if no window allready present */
          if(image.data('options').canTag && image.data('currentlyjTagging') == false ){

            image.data('currentlyjTagging', true);

            var tagWindow = jTag.domMethods.createTagWindow(image);
            image.parent().data('tagWindow', tagWindow)
                          .data('currentlyjTagging', true)
                          .addClass('tagging');

            inputContainer = image.parent().find('.jTagInputcontainer input').focus();


            jTag.privateMethods.positionTagWindow(tagWindow, event, 'center');

          } else if(image.data('currentlyjTagging') == true){

            jTag.privateMethods.positionTagWindow(image.parent().find('.jTagTagWindow'), event, 'center');

          }

        });

      },

      tagWindow: function(){

        $(document).on('mousemove', '.jTagImageContainer', function(event){

          event.preventDefault();

          if($(this).data('currentlyjTagging') == true){
          
            var tagWindow = $(this).data('tagWindow');
            
            if(tagWindow.data('mousedown') == true){
              jTag.privateMethods.positionTagWindow(tagWindow, event, 'relative');
            }

          }

          if($(this).data('jTagResizing') != false){
            //find cursor position relative to the container
            container_offset = $(this).offset();
            var tagWindow = $(this).data('tagWindow');
            
            x = event.pageX - container_offset.left;
            y = event.pageY - container_offset.top;

            desired_width =  x - parseInt(tagWindow.css('left'),10);
            desired_height = y - parseInt(tagWindow.css('top'),10);

            //handle minwidth & height
            if( $(this).data('options').minWidth != null )
            {
              desired_width = Math.max(desired_width, $(this).data('options').minWidth);
            } else {
              desired_width = Math.max(desired_width, 1);
            }

            if( $(this).data('options').minHeight != null )
            {
              desired_height = Math.max(desired_height, $(this).data('options').minHeight);
            } else {
               desired_height = Math.max(desired_height, 1);
            }

            //handle maxwidth & height
            if( $(this).data('options').maxWidth != null )
            {
              desired_width = Math.min(desired_width, $(this).data('options').maxWidth);
            }

            if( $(this).data('options').maxHeight != null )
            {
              desired_height = Math.min(desired_height, $(this).data('options').maxHeight);
            }

            //handle image constraint

            previous_height = tagWindow.height();

            tagWindow.css('width', desired_width +"px");
            tagWindow.css('height', desired_height +"px");

            inputContainer = tagWindow.parent().find('.jTagInputcontainer');
            inputContainer.css('top', parseInt(inputContainer.css('top'), 10) + (desired_height - previous_height));
            input = inputContainer.find('input');
            input.width(desired_width);



          }

        });

        $(document).on('mouseleave',".jTagImageContainer", function(event){
    
          event.preventDefault();

          if($(this).data('currentlyjTagging') == true){

            var tagWindow = $(this).data('tagWindow');
            
            if(tagWindow.data('mousedown') == true){
              tagWindow.css('cursor', 'auto');
              tagWindow.data('mousedown', false);
            }

          }
        
        });

        $(document).on('mousedown','.jTagTagWindow', function(event){
          
          event.preventDefault();
          $(this).css('cursor', 'move')
                 .data('mousedown', true)
                 .data('mouseOffsetX', event.pageX - $(this).data('offset').left - parseInt($(this).css('left'), 10))
                 .data('mouseOffsetY', event.pageY - $(this).data('offset').top - parseInt($(this).css('top'), 10))
        
        });

        $(document).on('mouseup',".jTagTagWindow", function(event){
        
          event.preventDefault();
          $(this).css('cursor', 'auto');
          $(this).data('mousedown', false)
        
        });

      },

      handles: function(){

        $(document).on('mouseup',".jTagImageContainer", function(event){

          $(this).data('jTagResizing',false)
          
        });

       $(document).on('mousedown', '.jTagHandle', function(event){
          event.preventDefault();
          event.stopPropagation();
          $(this).parent().parent().data('jTagResizing', true);
       });

      },

      input: function(){

        $(document).on('keypress', '.jTagInputcontainer input', function(event){
          if(event.keyCode == 13){
            
            var container = $(this).parent().parent();
            var tagWindow  = container.data('tagWindow');

            var top = parseInt(tagWindow.css('top'), 10);
            var left = parseInt(tagWindow.css('left'), 10);
            var width = tagWindow.width();
            var height = tagWindow.height();
            var text = $(this).val();

            //reset text 
            $(this).val('');

            jTag.domMethods.createTag(container, top, left, height, width, text);
            
            jTag.domMethods.closeTagWindow(container);
            
            //call callback is applicable
            if(container.data('options').save != null){
              container.data('options').save.call(top, left, width, height, text);
            }
          }
        });

      }
    },

    domMethods: {

      createInput: function(image){

        $("<div class='jTagInputcontainer'><input type='text' /></div>").appendTo(image.parent());

      },

      createTagWindow: function(image){

        var offset = image.offset();
        var container = image.parent();

        var tagWindow = $("<div class='jTagTagWindow'></div>").css('width', image.data('options').defaultWidth)
                                                              .css('height', image.data('options').defaultHeight)
                                                              .css('background-image', 'url('+image.attr('src') +') ')
                                                              .data("offset", offset)
                                                              .data("imageWidth", image.width())
                                                              .data("imageHeight", image.height())
                                                              .appendTo(container);

        $("<div class='jTagHandle'></div>").appendTo(tagWindow);

        return tagWindow;

      }, 

      createTag: function(container, top, left, width, height, text){

        var tag = $("<div class='jTagTag'></div>").css('top', top)
                                        .css('left', left)
                                        .width(width)
                                        .height(height);

        tag.appendTo(container);

      },

      closeTagWindow: function(container){
        container.data('currentlyjTagging', false)
                 .removeClass('tagging');

        container.data('image').data('currentlyjTagging', false);

        container.data('tagWindow').remove();
        container.data('tagWindow', null);
      }

    },

    privateMethods: {

      setupWrappers: function(image){

        image.addClass("jTagImage");

        var container = $("<div class='jTagImageContainer'></div>").css('width', image.width())
                                                                  .css('height', image.height())
                                                                  .data('image', image)
                                                                  .data("options", image.data('options'))
                                                                  .data('jTagResizing', false);


         image.wrap(container);

      },

      setupListeners: function(image){

        jTag.listeners.imageListener(image);
        jTag.listeners.tagWindow();
        jTag.listeners.handles();
        jTag.listeners.input();
        

      },

      positionTagWindow: function(tagWindow, event, type){

        inputContainer = tagWindow.parent().find('.jTagInputcontainer');

        if(type == "center"){

          inputContainer.find('input').width(tagWindow.width())

          window_x = event.pageX - tagWindow.data('offset').left - tagWindow.outerWidth() / 2
          window_y = event.pageY - tagWindow.data('offset').top  - tagWindow.outerHeight() / 2

        } else {

          relative_mouse_to_image_x = event.pageX - tagWindow.data('offset').left;
          relative_mouse_to_image_y = event.pageY - tagWindow.data('offset').top;

          mouse_offset_x = relative_mouse_to_image_x - parseInt(tagWindow.css('left'), 10)

          window_x = relative_mouse_to_image_x - tagWindow.data('mouseOffsetX')
          window_y = relative_mouse_to_image_y - tagWindow.data('mouseOffsetY')

        }

        window_x = Math.min(window_x, tagWindow.data('imageWidth') - tagWindow.outerWidth())
        window_y = Math.min(window_y, tagWindow.data('imageHeight') - tagWindow.outerHeight())

        window_x = Math.max(window_x, 0)
        window_y = Math.max(window_y, 0)

        image_position_x = tagWindow.data('imageWidth') - window_x - parseInt(tagWindow.css('border-left-width'), 10);
        image_position_y = tagWindow.data('imageHeight') - window_y - parseInt(tagWindow.css('border-top-width'), 10);

        tagWindow.css('top', window_y)
                  .css('left', window_x)
                  .css('background-position',  image_position_x+"px " + image_position_y+"px");

        inputContainer.css('top', window_y + tagWindow.outerHeight())
                      .css('left', window_x);

      }

    }

  }
	
	$.extend($.fn,{

		jTag: function(custom_options) {

			var defaults = {
				minWidth      : 100,
				minHeight     : 100,
				defaultWidth  : 100,
				defaultHeight : 100,
				maxHeight     : null,
				maxWidth      : null,
				save          : null,
				remove        : null,
				canTag        : true,
				canDelete     : true,
				autoShowDrag  : false,
				autoComplete  : null,
				defaultTags   : null,
				clickToTag    : true,
				draggable     : true,
				resizable     : true,
				showTag       : 'hover',
				showLabels    : true,
				debug         : false,
        clickable     : false,
        click         : null
			};
			
			options = $.extend(defaults, custom_options);  

			return this.each(function() {
				
				var image = $(this);
        image.data('options', options);
        image.data('currentlyjTagging', false);

        jTag.privateMethods.setupWrappers(image);
        jTag.domMethods.createInput(image);
        jTag.privateMethods.setupListeners(image);

      });
				
			
		}

	});
})(jQuery);
