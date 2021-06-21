# DVA Manager
Developed by Brett Feltmate and Jon Mulle; 2020


### Computes pixel value corresponding to one degree of visual angle.

_Note: This was designed for use w/ jsPsych, and scaling is applied to their wrapper class. Changing line 330 (as of writing) to target your wrapper will fix this._


_Note: Ideally this should not rescale text (makes finding appropriate font size maddening). 90% of the time this works 100% of the time._

**TO USE:**

1. In project CSS, developer must (arbitrarily) pick an initial pixel value corresponding to one DVA
   and use this value when specifying stimulus sizes (or at least have ensure stimuli are proportional to it).
   

2. In index file, construct a DVAManager, then assign to its `.one_dva` property the same arbitrary value, i.e,

        // in project.scss
        $one_dva = 50; // initial value of 50px per deg

        .placeholder { 
            width: $one_dva px;
            height: 2.0 * $one_dva px;
            ...
        }

        // in index.html
        let dva_initial = 50; // same initial value

        let dva_mgr = new DVAManager();
        dva_mgr.one_dva = dva_initial`

3. Wrap your experiment in a function, and in index file assign that function to the DVAManager property 'launch', i.e,
          
           dva_mgr.launch = function run_exp() {...experiment sequence...}

   This step might not be necessary, as long as you can ensure that the DVA calibration begins, and completes, before
   experiment execution sequence starts. But this has never been attempted so no promises.
   

4. Begin calibration by calling `dva_mgr.init()` Once this completes DVAManager will attempt to call the function assigned
   to 'launch', which will not exist and will fail if (3) is not completed. 

Note:
- `init()` accepts two args: `skip_calibration`, and `skip_tutorial`
Which are both boolean, undefined/false by default, and do exactly what you think they do.


- If you decide to not do (3), it is probably still a good idea to assign an empty function to 'launch' to prevent
reference and/or type errors which may or may not cause execution to halt.




**Process:**
- Takes a reference object of known width (default: credit card)
- Presumes object is held at a specified distance from user (default: 11", or 1 A4 sheet extending lengthwise from face)
- Computes DVA width of reference obj in stages: mm -> radians -> degrees (default, about 17.6 dva for a credit card)

- User resizes a box to 'wrap' (perceptually) around card using mouse, 'locked in' via spacebar
- After each resizing, resultant pixel width of box is divided by dva width of reference object to compute px per dva
- After 3 attempts, takes avg of the three px/dva

- This average is then divided by the initial value assigned to dva_mgr.one_dva to generate a scaling value
  i.e., if initial = 50, and computed = 75, then scaling = 75 / 50 == 1.5

- This scaling value is then applied via transform to the outer most wrapping element
  i.e., in the above example, the 'final' sizes of all elements would be 50% larger than that defined in project CSS

- Then `DVA_Manager` will call `launch()`, whether it exists or not.
