def makeActions():
   acts = []
   for i in range(5):
      acts.append(lambda x: i ** x)
   return acts

def makeActionsWithDefault():
   acts = []
   for i in range(5):
      acts.append(lambda x, i=i: i ** x)
   return acts

acts = makeActions()
for i in range(5): print(acts[i](2))

acts = makeActionsWithDefault()
for i in range(5): print(acts[i](2))
