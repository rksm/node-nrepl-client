(ns lively-connect.core (:gen-class))
(use '[clojure.tools.nrepl.server :only (start-server stop-server)])

(defn -main
  "Start nREPL server"
  [& args]
  (defonce server (start-server :port 7888)))
