export class CustomMacros

    (generator) ->
        @g = generator


    args = @args = {}


    args.\myMacro = <[ H o? ]>

    \myMacro : (o) ->
        [ "-", o, "-" ]


export { default: CustomMacros }